require("dotenv").config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const prisma = require('./prisma');
const logger = require('./lib/logger');
const { initSocket } = require('./lib/socket');
const { aiQueue } = require('./lib/queue');
const initAIWorker = require('./workers/aiWorker');
const initCleanupJobs = require('./services/cleanupService');
const { authMiddleware, aiRateLimiter } = require('./authMiddleware');
const { validateEntry } = require('./middleware/validate');

const app = express();
const server = http.createServer(app);

// 1. Initialize Real-time & Workers
const io = initSocket(server);
initAIWorker();
initCleanupJobs();

// 2. Middleware
app.set('trust proxy', 1); // Trust first proxy (e.g. Render, Vercel, Heroku)
app.use(helmet()); // Security headers
app.use(express.json());

const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true,
};
app.use(cors(corsOptions));

// 3. Health Check
app.get("/", (req, res) => {
  res.json({ 
    message: "Enterprise Photodiary API running", 
    status: "OK",
    timestamp: new Date().toISOString()
  });
});

// 4. Auth Routes (Simplified for this phase)
// In a real app, these would be in separate route files
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword }
    });
    res.status(201).json({ message: "User created", userId: user.id });
  } catch (error) {
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, role: true }
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

const crypto = require('crypto');

// 5. Entry Routes (Enterprise Level)
app.post("/entries", authMiddleware, validateEntry, aiRateLimiter, async (req, res) => {
  try {
    const { title, content, aiEnabled, media, mood, isPublic } = req.body;

    const shareHash = isPublic ? crypto.randomBytes(16).toString('hex') : null;

    // Use Raw SQL to bypass out-of-sync Prisma Client validation
    const processingStatus = aiEnabled ? 'PENDING' : 'COMPLETED';
    const results = await prisma.$queryRawUnsafe(
      `INSERT INTO "Entry" ("title", "content", "aiEnabled", "mood", "isPublic", "shareHash", "processingStatus", "userId", "updatedAt", "createdAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7::"ProcessingStatus", $8, NOW(), NOW()) 
       RETURNING *`,
      title || 'Untitled Moment',
      content,
      aiEnabled || false,
      mood ? String(mood) : null,
      isPublic || false,
      shareHash,
      processingStatus,
      req.userId
    );
    
    const entry = results[0];

    // Handle media separately if any
    if (media && media.length > 0) {
      await Promise.all(media.map(m => 
        prisma.$executeRawUnsafe(
          `INSERT INTO "Media" ("url", "publicId", "type", "entryId") VALUES ($1, $2, $3, $4)`,
          m.url, m.publicId, m.type || 'image', entry.id
        )
      ));
    }

    // If AI is enabled, add to Queue
    if (aiEnabled) {
      await aiQueue.add('process-entry', { entryId: entry.id }, {
        jobId: `entry_${entry.id}`
      });
      logger.info(`Entry ${entry.id} queued for AI processing`);
    }

    // Fetch full entry with media for response
    const fullEntry = await prisma.entry.findUnique({
      where: { id: entry.id },
      include: { media: true }
    });

    res.status(201).json(fullEntry);
  } catch (error) {
    logger.error('Entry Creation Error:', error);
    res.status(500).json({ error: "Failed to create entry" });
  }
});

app.get("/entries", authMiddleware, async (req, res) => {
  try {
    const entries = await prisma.entry.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      include: { 
        media: true, 
        tags: true,
        _count: {
          select: { likes: true, comments: true }
        },
        likes: {
          where: { userId: req.userId },
          select: { id: true }
        }
      }
    });
    // Flatten likes for frontend
    const results = entries.map(e => ({
      ...e,
      likedByMe: e.likes.length > 0,
      likesCount: e._count.likes,
      commentsCount: e._count.comments
    }));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

app.put("/entries/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, isPublic, mood, sharePermission } = req.body;
    
    const existing = await prisma.entry.findUnique({ 
      where: { id: parseInt(id), userId: req.userId } 
    });

    if (!existing) return res.status(404).json({ error: "Entry not found" });

    let shareHash = existing.shareHash;
    if (isPublic && !shareHash) {
      const crypto = require('crypto');
      shareHash = crypto.randomBytes(16).toString('hex');
    }

    const entry = await prisma.entry.update({
      where: { id: parseInt(id) },
      data: { 
        title, 
        content, 
        isPublic, 
        shareHash,
        sharePermission: sharePermission || 'VIEW',
        mood: mood ? String(mood) : undefined,
        updatedAt: new Date()
      }
    });
    res.json(entry);
  } catch (error) {
    logger.error('Entry Update Error:', error);
    res.status(500).json({ error: "Failed to update entry" });
  }
});

app.put("/collections/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isPublic, sharePermission } = req.body;
    
    const existing = await prisma.collection.findUnique({ where: { id: parseInt(id), userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Collection not found" });

    let shareHash = existing.shareHash;
    if (isPublic && !shareHash) {
      const crypto = require('crypto');
      shareHash = crypto.randomBytes(16).toString('hex');
    }

    const col = await prisma.collection.update({
      where: { id: parseInt(id), userId: req.userId },
      data: { 
        title, 
        description, 
        isPublic: isPublic !== undefined ? isPublic : existing.isPublic,
        shareHash,
        sharePermission: sharePermission || 'VIEW'
      }
    });
    res.json(col);
  } catch (error) {
    res.status(500).json({ error: "Failed to update collection" });
  }
});

app.delete("/entries/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const entryId = parseInt(id);
    
    // Manual cleanup for relations if not cascading
    await prisma.media.deleteMany({ where: { entryId } });
    await prisma.like.deleteMany({ where: { entryId } });
    await prisma.comment.deleteMany({ where: { entryId } });
    
    await prisma.entry.delete({
      where: { id: entryId, userId: req.userId }
    });
    res.json({ message: "Entry deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

app.post("/entries/:id/like", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const entryId = parseInt(id);
    const userId = req.userId;

    const existing = await prisma.like.findUnique({
      where: { userId_entryId: { userId, entryId } }
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return res.json({ liked: false });
    }

    await prisma.like.create({
      data: { userId, entryId }
    });
    res.json({ liked: true });
  } catch (error) {
    res.status(500).json({ error: "Action failed" });
  }
});

app.get("/entries/:id/comments", authMiddleware, async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { entryId: parseInt(req.params.id) },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

app.post("/entries/:id/comments", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await prisma.comment.create({
      data: {
        content,
        userId: req.userId,
        entryId: parseInt(req.params.id)
      },
      include: { user: { select: { email: true } } }
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Public Shared Entry Routes
app.get("/shared/:hash", async (req, res) => {
  try {
    const { hash } = req.params;
    const entry = await prisma.entry.findUnique({
      where: { shareHash: hash },
      include: { 
        media: true, 
        tags: true,
        user: { select: { email: true } }
      }
    });

    if (!entry || !entry.isPublic) {
      return res.status(404).json({ error: "Entry not found or not public" });
    }

    res.json(entry);
  } catch (error) {
    logger.error('Shared Entry Fetch Error:', error);
    res.status(500).json({ error: "Failed to fetch shared entry" });
  }
});

app.put("/shared/:hash", async (req, res) => {
  try {
    const { hash } = req.params;
    const { title, content, mood } = req.body;

    const existing = await prisma.entry.findUnique({ where: { shareHash: hash } });
    if (!existing || !existing.isPublic || existing.sharePermission !== 'EDIT') {
      return res.status(403).json({ error: "No permission to edit this entry" });
    }

    const entry = await prisma.entry.update({
      where: { shareHash: hash },
      data: { 
        title, 
        content, 
        mood: mood ? String(mood) : undefined,
        updatedAt: new Date()
      }
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
});

// Public Shared Collection Routes
app.get("/shared/collection/:hash", async (req, res) => {
  try {
    const { hash } = req.params;
    const col = await prisma.collection.findUnique({
      where: { shareHash: hash },
      include: { 
        entries: { include: { media: true } },
        user: { select: { email: true } }
      }
    });

    if (!col || !col.isPublic) {
      return res.status(404).json({ error: "Collection not found or not public" });
    }

    res.json(col);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch collection" });
  }
});

app.put("/shared/collection/:hash", async (req, res) => {
  try {
    const { hash } = req.params;
    const { title, description } = req.body;

    const existing = await prisma.collection.findUnique({ where: { shareHash: hash } });
    if (!existing || !existing.isPublic || existing.sharePermission !== 'EDIT') {
      return res.status(403).json({ error: "No permission to edit this collection" });
    }

    const col = await prisma.collection.update({
      where: { shareHash: hash },
      data: { title, description }
    });
    res.json(col);
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
});

// 6. Media Routes (Cloudinary Integration)
const multer = require('multer');
const { uploadMedia } = require('./lib/cloudinaryService');
const upload = multer({ storage: multer.memoryStorage() });

app.post("/upload", authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });
    
    const result = await uploadMedia(req.file.buffer);
    res.json(result);
  } catch (error) {
    logger.error('Upload Route Error:', error);
    res.status(500).json({ error: "Media upload failed" });
  }
});

// 7. Goal Routes
app.get("/goals", authMiddleware, async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" }
    });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

app.post("/goals", authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;
    const goal = await prisma.goal.create({
      data: { title, userId: req.userId }
    });
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ error: "Failed to create goal" });
  }
});

app.put("/goals/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isCompleted } = req.body;
    const goal = await prisma.goal.update({
      where: { id: parseInt(id), userId: req.userId },
      data: { isCompleted }
    });
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: "Failed to update goal" });
  }
});

app.delete("/goals/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.goal.delete({
      where: { id: parseInt(id), userId: req.userId }
    });
    res.json({ message: "Goal deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete goal" });
  }
});
// 8. AI Chat Routes
const { chatWithAI, analyzeDiaryEntry } = require('./services/aiService');

app.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const response = await chatWithAI(message, history);
    res.json({ response });
  } catch (error) {
    logger.error('Chat Route Error:', error);
    res.status(500).json({ error: "Chat failed" });
  }
});

// 9. Insights Route
app.get("/insights", authMiddleware, async (req, res) => {
  try {
    const entries = await prisma.entry.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { tags: true, media: true }
    });

    if (entries.length === 0) {
      return res.json({ insights: null, stats: { totalEntries: 0, avgMood: 0, topTags: [], streakDays: 0 } });
    }

    // Calculate stats
    const moodScores = entries.map(e => Number(e.mood)).filter(m => !isNaN(m) && m > 0);
    const avgMood = moodScores.length > 0 ? (moodScores.reduce((a, b) => a + b, 0) / moodScores.length).toFixed(1) : 0;

    // Tag frequency
    const tagCounts = {};
    entries.forEach(e => e.tags.forEach(t => { tagCounts[t.name] = (tagCounts[t.name] || 0) + 1; }));
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

    // Streak calculation
    let streakDays = 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dateSet = new Set(entries.map(e => { const d = new Date(e.createdAt); d.setHours(0,0,0,0); return d.getTime(); }));
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      if (dateSet.has(d.getTime())) { streakDays++; } else { break; }
    }

    // Mood distribution
    const moodDist = { great: 0, good: 0, okay: 0, low: 0 };
    moodScores.forEach(s => {
      if (s >= 9) moodDist.great++;
      else if (s >= 7) moodDist.good++;
      else if (s >= 5) moodDist.okay++;
      else moodDist.low++;
    });

    // Entries per day for last 14 days
    const last14 = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      const count = entries.filter(e => new Date(e.createdAt) >= d && new Date(e.createdAt) < next).length;
      last14.push({ date: d.toISOString().split('T')[0], count });
    }

    // AI Insight
    const entrySnippets = entries.slice(0, 10).map(e => `- ${e.title || 'Untitled'}: ${e.content?.slice(0, 100)}`).join('\n');
    const aiPrompt = `Based on these recent diary entries, give a warm, insightful 2-3 sentence reflection about patterns you notice, emotional trends, and one encouraging suggestion:\n\n${entrySnippets}`;
    const aiInsight = await chatWithAI(aiPrompt, []).catch(() => "Keep journaling! Your reflections are building a beautiful record of your life.");

    res.json({
      insights: aiInsight,
      stats: {
        totalEntries: entries.length,
        avgMood: Number(avgMood),
        topTags,
        streakDays,
        moodDist,
        last14Days: last14,
        entriesWithMedia: entries.filter(e => e.media?.length > 0).length
      }
    });
  } catch (error) {
    logger.error('Insights Error:', error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

// 10. Bucket List Routes
app.get("/bucket", authMiddleware, async (req, res) => {
  try {
    const items = await prisma.bucketItem.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bucket list" });
  }
});

app.post("/bucket", authMiddleware, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });
    const item = await prisma.bucketItem.create({
      data: { title, description, userId: req.userId }
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to create bucket item" });
  }
});

app.put("/bucket/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isCompleted, title, description } = req.body;
    const item = await prisma.bucketItem.update({
      where: { id: parseInt(id), userId: req.userId },
      data: { isCompleted, title, description }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to update bucket item" });
  }
});

app.delete("/bucket/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.bucketItem.delete({ where: { id: parseInt(id), userId: req.userId } });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete bucket item" });
  }
});

app.get("/collections/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await prisma.collection.findUnique({
      where: { id: parseInt(id), userId: req.userId },
      include: { 
        entries: { 
          include: { media: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!collection) return res.status(404).json({ error: "Collection not found" });
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch collection details" });
  }
});

// 11. Collections Routes
app.get("/collections", authMiddleware, async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: { 
        entries: { include: { media: true }, take: 3 }, 
        _count: { select: { entries: true } } 
      }
    });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch collections" });
  }
});

app.post("/collections", authMiddleware, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });
    const col = await prisma.collection.create({
      data: { title, description, userId: req.userId }
    });
    res.status(201).json(col);
  } catch (error) {
    res.status(500).json({ error: "Failed to create collection" });
  }
});

app.put("/collections/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isPublic, sharePermission } = req.body;
    const col = await prisma.collection.update({
      where: { id: parseInt(id), userId: req.userId },
      data: { title, description, isPublic, sharePermission }
    });
    res.json(col);
  } catch (error) {
    res.status(500).json({ error: "Failed to update collection" });
  }
});

app.delete("/collections/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.collection.delete({ where: { id: parseInt(id), userId: req.userId } });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete collection" });
  }
});

// Add entry to collection
app.post("/collections/:id/entries/:entryId", authMiddleware, async (req, res) => {
  try {
    const { id, entryId } = req.params;
    const col = await prisma.collection.findUnique({ where: { id: parseInt(id), userId: req.userId } });
    if (!col) return res.status(404).json({ error: "Collection not found" });
    await prisma.collection.update({
      where: { id: parseInt(id) },
      data: { entries: { connect: { id: parseInt(entryId) } } }
    });
    res.json({ message: "Entry added to collection" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add entry to collection" });
  }
});

// Remove entry from collection
app.delete("/collections/:id/entries/:entryId", authMiddleware, async (req, res) => {
  try {
    const { id, entryId } = req.params;
    await prisma.collection.update({
      where: { id: parseInt(id), userId: req.userId },
      data: { entries: { disconnect: { id: parseInt(entryId) } } }
    });
    res.json({ message: "Entry removed from collection" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove entry from collection" });
  }
});

// 12. Settings / Profile Routes
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, role: true, createdAt: true }
    });
    const stats = await prisma.entry.aggregate({
      where: { userId: req.userId },
      _count: { id: true }
    });
    res.json({ ...user, totalEntries: stats._count.id });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.put("/profile/password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: "Current password is incorrect" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } });
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update password" });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});