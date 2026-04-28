import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Check, RefreshCw } from "lucide-react";
import styles from "./MediaCapture.module.css";
import { apiRequest } from "../utils/api";

const FILTERS = [
    { name: "Normal", class: "" },
    { name: "Polaroid", class: "sepia(0.4) contrast(1.2) brightness(1.1)" },
    { name: "B&W", class: "grayscale(1) contrast(1.1)" },
    { name: "Vintage", class: "sepia(0.6) hue-rotate(-20deg) contrast(0.9)" },
    { name: "Candy", class: "saturate(1.8) contrast(0.9) brightness(1.1)" }
];

const MediaCapture = ({ onCapture, onClose }) => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [image, setImage] = useState(null);
    const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
    const [mode, setMode] = useState("camera"); // 'camera' or 'upload'
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (mode === "camera" && !image) {
            startCamera();
        }
        return () => stopCamera();
    }, [mode, image]);

    const [cameraError, setCameraError] = useState(null);

    const startCamera = async () => {
        setCameraError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError("Camera API not supported in this browser. Use HTTPS.");
            setMode("upload");
            return;
        }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                };
            }
            setMode("camera");
        } catch (err) {
            console.error("Camera access denied", err);
            setCameraError(err.name === 'NotAllowedError' ? "Permission Denied" : "Camera occupied or not found");
            setMode("upload");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const takePhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");

        // Apply horizontal flip if mirrored (optional, usually front cam)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);

        ctx.filter = activeFilter.class;
        ctx.drawImage(videoRef.current, 0, 0);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setImage(dataUrl);
        stopCamera();
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setImage(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const saveMedia = async () => {
        if (!image) return;
        setUploading(true);

        try {
            // Need to upload to backend/supabase
            // Step 1: Convert base64 to blob
            const res = await fetch(image);
            const blob = await res.blob();
            const file = new File([blob], "capture.jpg", { type: "image/jpeg" });

            // We need an entryId to upload directly... or we upload temp and return URL?
            // The current backend flow requires an entryId first.
            // So this component should probably return the FILE object to the parent,
            // and the parent handles the upload after creating the entry.

            onCapture({ file, preview: image, filter: activeFilter.name });
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to process image");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h3>Capture Memory</h3>
                    <button onClick={onClose} className={styles.closeBtn}><X /></button>
                </div>

                <div className={styles.previewArea}>
                    {image ? (
                        <img
                            src={image}
                            className={styles.pReview}
                            style={{ filter: activeFilter.class }}
                            alt="Captured"
                        />
                    ) : mode === "camera" ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={styles.video}
                            style={{ transform: "scaleX(-1)", filter: activeFilter.class }}
                        />
                    ) : (
                        <div className={styles.uploadPlaceholder}>
                            {cameraError && (
                                <div className="absolute top-4 left-4 right-4 bg-red-500/80 backdrop-blur-md p-3 rounded-xl text-[10px] font-black uppercase text-white flex items-center gap-2 z-20">
                                    <X size={14} /> {cameraError}
                                </div>
                            )}
                            <Upload size={48} color="#ccc" />
                            <p>Click to upload</p>
                            <input type="file" accept="image/*" onChange={handleFileUpload} className={styles.fileInput} />
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className={styles.filters}>
                    {FILTERS.map(f => (
                        <button
                            key={f.name}
                            className={`${styles.filterBtn} ${activeFilter.name === f.name ? styles.activeFilter : ''}`}
                            onClick={() => setActiveFilter(f)}
                            style={{ filter: f.class, background: '#eee' }}
                        >
                            <span style={{ filter: 'none' }}>{f.name}</span>
                        </button>
                    ))}
                </div>

                <div className={styles.controls}>
                    {!image ? (
                        <>
                            <button 
                                onClick={() => setMode(mode === 'camera' ? 'upload' : 'camera')} 
                                className={styles.iconBtn}
                                title={mode === 'camera' ? "Switch to Upload" : "Switch to Camera"}
                            >
                                {mode === 'camera' ? <Upload /> : <Camera />}
                                <span className="text-[10px] ml-2 uppercase font-black">
                                    {mode === 'camera' ? "Go to Upload" : "Open Camera"}
                                </span>
                            </button>
                            {mode === 'camera' && (
                                <button onClick={takePhoto} className={styles.snapBtn}>
                                    <div className={styles.innerSnap} />
                                </button>
                            )}
                            {mode === 'upload' && (
                                <div className="text-gray-500 text-[10px] uppercase font-black">
                                    Upload mode active
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <button onClick={() => { setImage(null); startCamera(); }} className={styles.retakeBtn}>
                                <RefreshCw size={20} /> Retake
                            </button>
                            <button onClick={saveMedia} disabled={uploading} className="btn btn-primary">
                                <Check size={20} /> {uploading ? "Processing..." : "Use Photo"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaCapture;
