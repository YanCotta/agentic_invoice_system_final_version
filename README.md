# 📊 Brim Invoice Processing System (Next.js Frontend)

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Node.js](https://img.shields.io/badge/Node.js-Latest-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-Latest-black.svg)](https://nextjs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT4-412991.svg)](https://openai.com/)

*An intelligent invoice processing system leveraging LangChain's multi-agent workflow*

[Overview](#-overview) •
[Features](#-key-features) •
[Development Journey](#-development-journey) •
[Architecture](#-architecture) •
[Setup Guide](#-setup-guide) •
[Usage](#-usage-guide) •
[Progress](#-project-progress)

</div>

## 🎯 Overview

This repository houses the Next.js frontend version of the Brim Invoice Processing System, built as a technical challenge response. The system demonstrates an intelligent solution that leverages LangChain's multi-agent workflow to automate invoice processing, aiming to reduce manual processing time by 75% while minimizing errors.

> 💡 *A Streamlit frontend version is available in a separate repository for those interested in a simpler, Python-based interface.*

## 📋 Key Features

- **Automated Processing Pipeline**
  - Processes PDFs from configurable directories:
    - `data/raw/invoices/` (35 invoices)
    - `data/raw/test_samples/` (3 PDFs)
  - Multi-agent system for extraction, validation, and matching
  - RAG-based error handling with FAISS
  - Asynchronous processing with robust error management

- **Modern Frontend Interface**
  - Next.js-powered dashboard
  - Real-time processing updates
  - Interactive invoice review system
  - Comprehensive metrics visualization

- **Enterprise-Grade Architecture**
  - FastAPI backend with WebSocket support
  - Structured logging and monitoring
  - Comprehensive test coverage
  - Containerized deployment ready

## 📅 Development Journey

### Week 1: Foundation & Core Development

#### Day 1: Project Planning and Setup
- 🎯 **Objectives Achieved**
  - Organized detailed 10-day development roadmap
  - Analyzed technical challenge requirements
  - Initialized project structure
  
- 🛠️ **Technical Implementation**
  - Set up FastAPI backend and Next.js frontend
  - Installed core dependencies:
    - LangChain (0.2.16)
    - PDF processing (pdfplumber)
    - OCR capabilities (pytesseract)

#### Day 2: Invoice Processing Foundation
- 🎯 **Objectives Achieved**
  - Implemented core extraction logic
  - Established validation framework
  
- 🛠️ **Technical Implementation**
  - Developed InvoiceExtractionAgent with Pydantic models
  - Implemented PDF parsing and OCR pipeline
  - Created validation system with anomaly detection

#### Day 3: Intelligence & Error Handling
- 🎯 **Objectives Achieved**
  - Enhanced system reliability
  - Improved extraction accuracy
  
- 🛠️ **Technical Implementation**
  - Integrated FAISS-based RAG for error handling
  - Migrated from Mistral 7B to OpenAI's gpt-4o-mini API
  - Implemented performance monitoring
  - Added fallback mechanisms

#### Day 4: Advanced Features & Frontend
- 🎯 **Objectives Achieved**
  - Completed PO matching system
  - Enhanced user interface
  
- 🛠️ **Technical Implementation**
  - Built PurchaseOrderMatchingAgent with fuzzy matching
  - Migrated from Streamlit to Next.js
  - Implemented advanced frontend features

#### Day 5: System Refinement
- 🎯 **Objectives Achieved**
  - Resolved critical system issues
  - Enhanced user experience
  
- 🛠️ **Technical Fixes**
  1. **WebSocket Connectivity**
     - Issue: Connection failures during batch processing
     - Solution: Implemented proper WebSocket handling
     
  2. **File Upload Reliability**
     - Issue: 422 errors with invalid files
     - Solution: Enhanced error handling and user feedback
     
  3. **PDF Viewing System**
     - Issue: 404 errors in PDF preview
     - Solution: Restructured PDF storage and serving
     
  4. **Data Format Consistency**
     - Issue: Date format inconsistencies
     - Solution: Standardized date handling (yyyy-MM-dd)
     
  5. **Batch Processing UX**
     - Issue: Multiple submission issues
     - Solution: Implemented proper loading states and safeguards

## 🏗️ Architecture

### Project Structure
```
brim_invoice_nextjs/
├── agents/                    # AI Agents
│   ├── base_agent.py         # Base agent functionality
│   ├── extractor_agent.py    # Invoice data extraction
│   ├── validator_agent.py    # Data validation
│   ├── matching_agent.py     # PO matching
│   ├── human_review_agent.py # Manual review handling
│   └── fallback_agent.py     # Backup extraction
│
├── api/                      # Backend Services
│   ├── app.py               # Main FastAPI application
│   ├── human_review_api.py  # Review endpoints
│   └── review_api.py        # Review logic
│
├── config/                   # Configuration
│   ├── logging_config.py    # Logging setup
│   ├── monitoring.py        # Performance tracking
│   └── settings.py          # System settings
│
├── data/                     # Data Storage
│   ├── raw/                 # Input data
│   ├── processed/           # Processed results
│   └── temp/                # Temporary files
│
├── data_processing/          # Processing Logic
│   ├── document_parser.py   # PDF handling
│   ├── ocr_helper.py        # OCR processing
│   ├── rag_helper.py        # RAG implementation
│   └── [other modules]      # Additional processors
│
├── frontend-nextjs/         # Frontend Application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Application routes
│   │   └── styles/         # CSS styling
│   └── [config files]       # Frontend configuration
│
└── [other project files]    # Additional resources
```

## 🔧 Setup Guide

### Prerequisites
- Python 3.12+
- Node.js (Latest LTS)
- Virtual environment tool
- Git
- Sample data files

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd brim_invoice_nextjs
   ```

2. **Python Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # OR
   venv\Scripts\activate     # Windows
   ```

3. **Backend Setup**
   ```bash
   pip install -r requirements.txt
   sudo apt-get install libblas-dev liblapack-dev
   ```

4. **Frontend Setup**
   ```bash
   cd frontend-nextjs
   npm install
   ```

5. **Environment Configuration**
   ```bash
   echo "OPENAI_API_KEY=your_api_key_here" > .env
   ```

6. **Data Verification**
   - Confirm presence of:
     - PDFs in `data/raw/invoices/`
     - Test files in `data/raw/test_samples/`
     - `data/raw/vendor_data.csv`

## 🚀 Usage Guide

### Starting Services

1. **Backend APIs**
   ```bash
   # Terminal 1: Main API
   python -m uvicorn api.app:app --reload --port 8000

   # Terminal 2: Review API
   python -m uvicorn api.human_review_api:app --reload --port 8001
   ```

2. **Frontend Application**
   ```bash
   cd frontend-nextjs
   npm run dev
   ```

### Accessing the System

- **Main Application**: http://localhost:3000
- **API Endpoints**:
  - Main API: http://localhost:8000
  - Review API: http://localhost:8001

### Core Workflows

1. **Invoice Processing**
   - Navigate to http://localhost:3000/upload
   - Upload invoice PDF(s)
   - Monitor processing status

2. **Results Management**
   - Processed invoices: `/invoices`
   - Flagged items: `/review`
   - Performance metrics: `/metrics`

3. **Review Process**
   - Access review interface
   - Edit flagged invoices
   - Submit corrections

### System Behavior

- **Duplicate Detection**: Automatic flagging by invoice_number
- **Confidence Thresholds**:
  - ≥0.9: Automatic processing
  - <0.9: Human review required
- **Processing Mode**: Asynchronous execution
- **Data Persistence**: Metrics and logs maintained

## 📈 Project Progress

### Completed (Days 1-5)
- ✅ Multi-agent system implementation
- ✅ Frontend migration (Streamlit → Next.js)
- ✅ OpenAI API integration
- ✅ RAG-based error handling
- ✅ Critical system improvements

### Remaining Tasks (Days 6-8)
- 📋 Day 6: Containerization & CI/CD
- 📋 Day 7: Documentation & Testing
- 📋 Day 8: Performance Optimization & Submission

### Recent Enhancements
- 🆕 Form validation (react-hook-form + yup)
- 🆕 Toast notifications (react-hot-toast)
- 🆕 PDF preview system (react-pdf)
- 🆕 Enhanced error handling
- 🆕 WebSocket stability improvements

---

<div align="center">

**Built with ❤️ for the Technical Challenge**

</div>