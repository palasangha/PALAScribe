# PALAScribe System Architecture Diagrams
*Comprehensive Visual Technical Documentation*

## 📊 Executive Overview

PALAScribe is a local, privacy-first audio transcription system specifically designed for VRI (Vipassana Research Institute) content. This document provides detailed architecture diagrams, data flow charts, timing analysis, and system requirements.

---

## 🎯 System Architecture Overview

```
                           ╔══════════════════════════════════════════════════════════════════╗
                           ║                        PALAScribe Ecosystem                      ║
                           ╚══════════════════════════════════════════════════════════════════╝
                                                          │
                            ┌─────────────────────────────┼─────────────────────────────┐
                            │                             │                             │
                            ▼                             ▼                             ▼
     ┌─────────────────────────────────┐    ┌─────────────────────────────────┐    ┌─────────────────────────────────┐
     │          USER LAYER             │    │        FRONTEND LAYER           │    │        BACKEND LAYER            │
     │                                 │    │                                 │    │                                 │
     │ ┌─────────────────────────────┐ │    │ ┌─────────────────────────────┐ │    │ ┌─────────────────────────────┐ │
     │ │      User Interface         │ │    │ │       Web Browser           │ │    │ │      Python Server         │ │
     │ │                             │ │    │ │                             │ │    │ │                             │ │
     │ │ • Audio File Upload         │◄┼────┼─│ • Chrome/Firefox/Safari     │◄┼────┼─│ • Flask HTTP Server         │ │
     │ │ • Project Management        │ │    │ │ • JavaScript ES6+           │ │    │ │ • Port 8765 (localhost)     │ │
     │ │ • Rich Text Editing         │ │    │ │ • Local Storage             │ │    │ │ • CORS Enabled              │ │
     │ │ • Status Monitoring         │ │    │ │ • File API                  │ │    │ │ • JSON API                  │ │
     │ │ • Download Results          │ │    │ │ • Fetch API                 │ │    │ │ • Error Handling            │ │
     │ └─────────────────────────────┘ │    │ └─────────────────────────────┘ │    │ └─────────────────────────────┘ │
     └─────────────────────────────────┘    └─────────────────────────────────┘    └─────────────────────────────────┘
                            │                             │                             │
                            │                             │                             │
                            └─────────────────────────────┼─────────────────────────────┘
                                                          │
                                        ┌─────────────────┼─────────────────┐
                                        │                 │                 │
                                        ▼                 ▼                 ▼
     ┌─────────────────────────────────┐    ┌─────────────────────────────────┐    ┌─────────────────────────────────┐
     │        AI/ML LAYER              │    │       STORAGE LAYER             │    │        SYSTEM LAYER             │
     │                                 │    │                                 │    │                                 │
     │ ┌─────────────────────────────┐ │    │ ┌─────────────────────────────┐ │    │ ┌─────────────────────────────┐ │
     │ │      Whisper Engine         │ │    │ │      Local Storage          │ │    │ │      Operating System       │ │
     │ │                             │ │    │ │                             │ │    │ │                             │ │
     │ │ • Model Loading             │ │    │ │ • Browser localStorage       │ │    │ │ • macOS/Windows/Linux       │ │
     │ │ • Audio Processing          │ │    │ │ • IndexedDB                 │ │    │ │ • Python Runtime            │ │
     │ │ • Speech Recognition        │ │    │ │ • Temporary Files           │ │    │ │ • FFmpeg Dependencies       │ │
     │ │ • Timestamp Generation      │ │    │ │ • Model Cache               │ │    │ │ • Virtual Environment       │ │
     │ │ • Confidence Scoring        │ │    │ │ • Audio Blobs               │ │    │ │ • File System Access        │ │
     │ └─────────────────────────────┘ │    │ └─────────────────────────────┘ │    │ └─────────────────────────────┘ │
     │                                 │    │                                 │    │                                 │
     │ ┌─────────────────────────────┐ │    │ ┌─────────────────────────────┐ │    │ ┌─────────────────────────────┐ │
     │ │    Pali Processor           │ │    │ │      Project Database       │ │    │ │      Hardware Layer         │ │
     │ │                             │ │    │ │                             │ │    │ │                             │ │
     │ │ • Dictionary Lookup         │ │    │ │ • Project Metadata          │ │    │ │ • CPU (4+ cores)            │ │
     │ │ • Diacritic Correction      │ │    │ │ • Audio References          │ │    │ │ • RAM (16GB+ recommended)   │ │
     │ │ • Pattern Matching          │ │    │ │ • Transcription Data        │ │    │ │ • Storage (SSD preferred)   │ │
     │ │ • Text Enhancement          │ │    │ │ • Status Tracking           │ │    │ │ • GPU (optional)            │ │
     │ │ • Quality Analysis          │ │    │ │ • User Preferences          │ │    │ │ • Network (localhost only)  │ │
     │ └─────────────────────────────┘ │    │ └─────────────────────────────┘ │    │ └─────────────────────────────┘ │
     └─────────────────────────────────┘    └─────────────────────────────────┘    └─────────────────────────────────┘
```

---

## 🔄 Detailed Data Flow Architecture

### 1. Audio Processing Data Flow

```
┌─────────────────────┐
│   User Selection    │ ──► Audio file selected (MP3/WAV/M4A/FLAC/OGG)
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│ Frontend Validation │ ──► Size check (max 100MB), Format validation
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Project Creation   │ ──► Generate unique ID, Store metadata
└─────────────────────┘
           │
           ▼                    ┌─────────────────────────────────────────────┐
┌─────────────────────┐        │              Network Layer                  │
│   HTTP Upload       │ ──────►│  POST /process (multipart/form-data)       │
└─────────────────────┘        │  Content-Length: file size                 │
           │                    │  Content-Type: multipart/form-data         │
           ▼                    └─────────────────────────────────────────────┘
┌─────────────────────┐                              │
│ Backend Reception   │ ◄────────────────────────────┘
└─────────────────────┘
           │
           ▼
┌─────────────────────┐        ┌─────────────────────────────────────────────┐
│  File Validation    │ ──────►│          Validation Checks                  │
└─────────────────────┘        │  • MIME type verification                  │
           │                    │  • File size limits                        │
           ▼                    │  • Audio format compatibility              │
┌─────────────────────┐        │  • Malformed file detection                │
│ Audio Preprocessing │        └─────────────────────────────────────────────┘
└─────────────────────┘
           │
           ▼                    ┌─────────────────────────────────────────────┐
┌─────────────────────┐        │             FFmpeg Pipeline                 │
│  Format Conversion  │ ──────►│  • Audio format standardization            │
└─────────────────────┘        │  • Sample rate conversion (16kHz)          │
           │                    │  • Mono channel conversion                 │
           ▼                    │  • Quality optimization                    │
┌─────────────────────┐        └─────────────────────────────────────────────┘
│  Model Loading      │
└─────────────────────┘
           │
           ▼                    ┌─────────────────────────────────────────────┐
┌─────────────────────┐        │            Whisper Processing               │
│ Speech Recognition  │ ──────►│  • Model initialization                    │
└─────────────────────┘        │  • Audio segmentation                      │
           │                    │  • Feature extraction                      │
           ▼                    │  • Neural network inference                │
┌─────────────────────┐        │  • Confidence scoring                      │
│ Raw Transcription   │        └─────────────────────────────────────────────┘
└─────────────────────┘
           │
           ▼                    ┌─────────────────────────────────────────────┐
┌─────────────────────┐        │           Post-Processing                   │
│  Pali Correction    │ ──────►│  • Dictionary lookup (150+ terms)          │
└─────────────────────┘        │  • Diacritic correction                    │
           │                    │  • Pattern matching                        │
           ▼                    │  • Case correction                         │
┌─────────────────────┐        │  • Context-aware replacements              │
│ Text Formatting     │        └─────────────────────────────────────────────┘
└─────────────────────┘
           │
           ▼                    ┌─────────────────────────────────────────────┐
┌─────────────────────┐        │            Response Assembly                │
│  JSON Response      │ ──────►│  • Transcription text                      │
└─────────────────────┘        │  • Processing metadata                     │
           │                    │  • Timing information                      │
           ▼                    │  • Quality metrics                         │
┌─────────────────────┐        │  • Pali corrections log                    │
│ Frontend Update     │        └─────────────────────────────────────────────┘
└─────────────────────┘
           │
           ▼
┌─────────────────────┐        ┌─────────────────────────────────────────────┐
│  Status Change      │ ──────►│         Project State Update               │
└─────────────────────┘        │  NEW → PROCESSING → NEEDS_REVIEW           │
           │                    │  Storage in localStorage                    │
           ▼                    │  UI notification                           │
┌─────────────────────┐        └─────────────────────────────────────────────┘
│  User Notification  │
└─────────────────────┘
```

---

## ⏱️ Processing Time Analysis & Performance Metrics

### Whisper Model Performance Comparison

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  Processing Time Matrix                                      │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  Model    │  VRAM   │  CPU     │   1min Audio   │   10min Audio   │   1hr Audio   │  Accuracy │
│  Size     │  Usage  │  Cores   │                │                 │               │           │
│────────────────────────────────────────────────────────────────────────────────────────────│
│  tiny     │  ~1GB   │   2-4    │    5-10s       │    30-60s       │    5-8min     │    ~85%   │
│           │         │          │    ████▓░░░░   │    ██████▓░░░   │    ████████▓▓ │           │
│────────────────────────────────────────────────────────────────────────────────────────────│
│  base     │  ~1GB   │   2-4    │    8-15s       │    45-90s       │    7-12min    │    ~89%   │
│           │         │          │    ██████▓░░░ │    ████████▓░░ │    ██████████▓ │           │
│────────────────────────────────────────────────────────────────────────────────────────────│
│  small    │  ~2GB   │   4-6    │   12-20s       │   60-120s       │   10-18min    │    ~92%   │
│           │         │          │    ████████▓░ │    ██████████▓ │    ████████████ │           │
│────────────────────────────────────────────────────────────────────────────────────────────│
│  medium   │  ~5GB   │   6-8    │   15-30s       │   90-180s       │   15-25min    │    ~95%   │ ◄── Recommended
│           │         │          │    ██████████ │    ████████████ │    ████████████ │           │
│────────────────────────────────────────────────────────────────────────────────────────────│
│  large    │ ~10GB   │   8+     │   20-40s       │  120-240s       │   20-35min    │    ~97%   │
│           │         │          │    ████████████ │    ████████████ │    ████████████ │           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

Legend: ░ = Waiting  ▓ = Processing  █ = Complete
```

### Real-Time Processing Breakdown

```
Total Processing Time = Model Loading + Audio Processing + Post-Processing + Response

┌─────────────────────┐
│   Model Loading     │ ──► 5-15s (first use), <1s (cached)
└─────────────────────┘
           │
           ▼
┌─────────────────────┐     ┌──────────────────────────────────────────────┐
│  Audio Processing   │ ───►│  Time = Audio_Length × Model_Factor          │
└─────────────────────┘     │                                              │
           │                 │  Model Factors:                             │
           │                 │  • tiny:   0.1x - 0.2x                     │
           │                 │  • base:   0.15x - 0.25x                   │
           │                 │  • small:  0.2x - 0.3x                     │
           │                 │  • medium: 0.25x - 0.5x  ◄── Default       │
           │                 │  • large:  0.3x - 0.6x                     │
           ▼                 └──────────────────────────────────────────────┘
┌─────────────────────┐
│  Post-Processing    │ ──► 1-3s (Pali corrections + formatting)
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Response Assembly  │ ──► <1s (JSON creation + network transfer)
└─────────────────────┘
```

---

## 🖥️ System Requirements Matrix

### Hardware Requirements by Use Case

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                Hardware Requirements                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  Use Case          │    CPU           │    RAM      │   Storage   │    GPU         │  Model  │
│─────────────────────────────────────────────────────────────────────────────────────────────│
│  Personal Use      │  2-4 cores       │    8GB      │    5GB      │  Not Required  │  small  │
│  (Casual)          │  2.5GHz+         │             │             │                │         │
│─────────────────────────────────────────────────────────────────────────────────────────────│
│  Regular Use       │  4-6 cores       │   16GB      │   20GB      │  Optional      │  medium │ ◄── Recommended
│  (Daily)           │  3.0GHz+         │             │             │  4GB VRAM      │         │
│─────────────────────────────────────────────────────────────────────────────────────────────│
│  Professional     │  6-8 cores       │   32GB      │   50GB      │  Recommended   │  large  │
│  (Production)      │  3.5GHz+         │             │    SSD      │  8GB VRAM      │         │
│─────────────────────────────────────────────────────────────────────────────────────────────│
│  Enterprise        │  8+ cores        │   64GB      │  100GB      │  Required      │  large  │
│  (High Volume)     │  4.0GHz+         │             │   NVMe      │ 16GB VRAM      │         │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Software Compatibility Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              Software Compatibility                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  Component        │  Minimum Version  │  Recommended   │   Notes                            │
│─────────────────────────────────────────────────────────────────────────────────────────────│
│  Python           │     3.8.x         │    3.10+       │  Required for Whisper             │
│  Node.js          │    Not Required   │      N/A       │  Frontend uses vanilla JS          │
│  Chrome           │     80.x          │   Latest       │  Primary testing browser           │
│  Firefox          │     80.x          │   Latest       │  Full compatibility                │
│  Safari           │     13.x          │   Latest       │  macOS support                     │
│  Edge             │     90.x          │   Latest       │  Windows support                   │
│  FFmpeg           │     4.0           │    5.0+        │  Audio processing                  │
│  macOS            │    10.14          │   12.0+        │  Monterey+ recommended             │
│  Windows          │      10           │     11         │  Windows 11 preferred              │
│  Ubuntu           │    18.04          │   20.04+       │  LTS versions                      │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Component Integration Diagram

### Frontend-Backend Communication Flow

```
                   Browser Environment                          Python Server Environment
    ┌─────────────────────────────────────────────┐         ┌─────────────────────────────────────────────┐
    │                                             │         │                                             │
    │  ┌─────────────────────────────────────┐   │   HTTP  │   ┌─────────────────────────────────────┐   │
    │  │            UI Controller            │   │ Request │   │          Flask Router           │   │
    │  │                                     │   │ ─────── │   │                                     │   │
    │  │  • Event Handling                   │   │   POST  │   │  • /process endpoint                │   │
    │  │  • Form Validation                  │◄──┼─ /process│  ►│  • CORS headers                     │   │
    │  │  • Progress Updates                 │   │         │   │  • Request validation               │   │
    │  │  • Error Display                    │   │Response │   │  • Error handling                   │   │
    │  │  • Status Management                │   │ ─────── │   │                                     │   │
    │  └─────────────────────────────────────┘   │   JSON  │   └─────────────────────────────────────┘   │
    │                    │                       │         │                     │                       │
    │                    ▼                       │         │                     ▼                       │
    │  ┌─────────────────────────────────────┐   │         │   ┌─────────────────────────────────────┐   │
    │  │          Project Manager            │   │         │   │       Audio Processor           │   │
    │  │                                     │   │         │   │                                     │   │
    │  │  • Data Persistence                 │   │         │   │  • File handling                    │   │
    │  │  • State Management                 │   │         │   │  • Format validation                │   │
    │  │  • Local Storage                    │   │         │   │  • FFmpeg integration              │   │
    │  │  • Audio Blob URLs                  │   │         │   │  • Temporary file management       │   │
    │  └─────────────────────────────────────┘   │         │   └─────────────────────────────────────┘   │
    │                    │                       │         │                     │                       │
    │                    ▼                       │         │                     ▼                       │
    │  ┌─────────────────────────────────────┐   │         │   ┌─────────────────────────────────────┐   │
    │  │         Rich Text Editor            │   │         │   │        Whisper Engine           │   │
    │  │                                     │   │         │   │                                     │   │
    │  │  • Content Editing                  │   │         │   │  • Model management                 │   │
    │  │  • Pali Highlighting                │   │         │   │  • Speech recognition              │   │
    │  │  • Auto-save                        │   │         │   │  • Timestamp generation            │   │
    │  │  • Word/Character Count             │   │         │   │  • Confidence scoring              │   │
    │  └─────────────────────────────────────┘   │         │   └─────────────────────────────────────┘   │
    │                                             │         │                     │                       │
    │                                             │         │                     ▼                       │
    │                                             │         │   ┌─────────────────────────────────────┐   │
    │                                             │         │   │        Pali Processor           │   │
    │                                             │         │   │                                     │   │
    │                                             │         │   │  • Dictionary lookup               │   │
    │                                             │         │   │  • Diacritic correction            │   │
    │                                             │         │   │  • Pattern matching                │   │
    │                                             │         │   │  • Text enhancement                │   │
    │                                             │         │   └─────────────────────────────────────┘   │
    │                                             │         │                                             │
    └─────────────────────────────────────────────┘         └─────────────────────────────────────────────┘
                          ▲                                                         │
                          │                                                         │
                          └─────────────────────────────────────────────────────────┘
                                              JSON Response
                                         {transcription, metadata, corrections}
```

---

## 🔐 Security & Privacy Architecture

### Data Flow Security Model

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Security Layers                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  Layer 1: Input Security                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  • File type validation (MIME type checking)                                        │  │
│  │  • File size limitations (prevent DoS)                                             │  │
│  │  • Content scanning (basic malware detection)                                      │  │
│  │  • Upload rate limiting                                                            │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                          │                                                  │
│                                          ▼                                                  │
│  Layer 2: Network Security                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  • Localhost-only communication (127.0.0.1:8765)                                  │  │
│  │  • No external network access required                                             │  │
│  │  • CORS headers properly configured                                                │  │
│  │  • HTTPS support (for production deployment)                                       │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                          │                                                  │
│                                          ▼                                                  │
│  Layer 3: Process Security                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  • Python virtual environment isolation                                            │  │
│  │  • Temporary file auto-cleanup                                                     │  │
│  │  • Process sandboxing (user permissions)                                           │  │
│  │  • Resource limits (memory, CPU)                                                   │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                          │                                                  │
│                                          ▼                                                  │
│  Layer 4: Data Security                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  • Local-only processing (no cloud transmission)                                   │  │
│  │  • Browser storage encryption (future)                                             │  │
│  │  • Secure file deletion                                                            │  │
│  │  • Audio data never persisted on server                                           │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📈 Performance Optimization Strategy

### Bottleneck Analysis & Solutions

```
Processing Bottlenecks & Optimization Strategies:

┌─────────────────────┐     ┌─────────────────────────────────────────────┐
│   File Upload       │────►│ Optimization: Browser File API             │
│   (Network I/O)     │     │ • Stream processing                        │
│   Bottleneck: 10%   │     │ • Progressive upload                       │
└─────────────────────┘     │ • Client-side compression                  │
                            └─────────────────────────────────────────────┘

┌─────────────────────┐     ┌─────────────────────────────────────────────┐
│   Model Loading     │────►│ Optimization: Intelligent Caching          │
│   (Memory/Disk)     │     │ • Model persistence in memory              │
│   Bottleneck: 15%   │     │ • Lazy loading strategies                  │
└─────────────────────┘     │ • Model selection optimization             │
                            └─────────────────────────────────────────────┘

┌─────────────────────┐     ┌─────────────────────────────────────────────┐
│  Audio Processing   │────►│ Optimization: Hardware Acceleration        │
│  (CPU/GPU Compute)  │     │ • GPU utilization (CUDA/Metal)             │
│  Bottleneck: 60%    │     │ • Multi-threading                          │
└─────────────────────┘     │ • Audio segmentation                       │
                            │ • Parallel processing                      │
                            └─────────────────────────────────────────────┘

┌─────────────────────┐     ┌─────────────────────────────────────────────┐
│  Post-Processing    │────►│ Optimization: Algorithmic Efficiency       │
│  (Text Processing)  │     │ • Optimized regex patterns                 │
│  Bottleneck: 10%    │     │ • Dictionary lookup caching                │
└─────────────────────┘     │ • Batch text operations                    │
                            └─────────────────────────────────────────────┘

┌─────────────────────┐     ┌─────────────────────────────────────────────┐
│   Response          │────►│ Optimization: Data Transfer                 │
│   (JSON Assembly)   │     │ • Compressed responses                      │
│   Bottleneck: 5%    │     │ • Streaming responses                       │
└─────────────────────┘     │ • Minimal payload size                     │
                            └─────────────────────────────────────────────┘
```

---

## 🏗️ Deployment Architecture Options

### Development vs Production Environments

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              Deployment Configurations                                      │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌─────────────────────────────────┐              ┌─────────────────────────────────┐      │
│  │        Development Setup        │              │       Production Setup          │      │
│  │                                 │              │                                 │      │
│  │  ┌─────────────────────────────┐│              │┌─────────────────────────────┐ │      │
│  │  │      Direct Execution       ││              ││     Containerized Deploy    │ │      │
│  │  │                             ││              ││                             │ │      │
│  │  │  python whisper_server.py   ││              ││  Docker + Volume Mounts     │ │      │
│  │  │  open index.html            ││              ││  nginx reverse proxy        │ │      │
│  │  │                             ││              ││  SSL termination           │ │      │
│  │  │  • Hot reloading            ││              ││  • Process management       │ │      │
│  │  │  • Debug logging            ││              ││  • Log aggregation          │ │      │
│  │  │  • File watching            ││              ││  • Health monitoring        │ │      │
│  │  └─────────────────────────────┘│              │└─────────────────────────────┘ │      │
│  └─────────────────────────────────┘              └─────────────────────────────────┘      │
│                                                                                             │
│  ┌─────────────────────────────────┐              ┌─────────────────────────────────┐      │
│  │       Single User Setup         │              │      Multi-User Setup           │      │
│  │                                 │              │                                 │      │
│  │  ┌─────────────────────────────┐│              │┌─────────────────────────────┐ │      │
│  │  │     Local Installation      ││              ││    Shared Server Deploy     │ │      │
│  │  │                             ││              ││                             │ │      │
│  │  │  • Personal workspace       ││              ││  • Multiple user sessions   │ │      │
│  │  │  • Local storage            ││              ││  • Shared model cache       │ │      │
│  │  │  • Simple configuration     ││              ││  • Load balancing           │ │      │
│  │  │                             ││              ││  • User isolation           │ │      │
│  │  │  Specs:                     ││              ││  • Queue management         │ │      │
│  │  │  • 8GB RAM minimum          ││              ││                             │ │      │
│  │  │  • 20GB storage             ││              ││  Specs:                     │ │      │
│  │  │  • 4 CPU cores              ││              ││  • 64GB RAM                 │ │      │
│  │  └─────────────────────────────┘│              ││  • 500GB storage            │ │      │
│  └─────────────────────────────────┘              ││  • 16+ CPU cores            │ │      │
│                                                   │└─────────────────────────────┘ │      │
│                                                   └─────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

This comprehensive architecture documentation provides detailed visual representations of PALAScribe's technical design, data flows, performance characteristics, and deployment options. The diagrams use ASCII art to ensure compatibility across all platforms while maintaining clear technical communication.
