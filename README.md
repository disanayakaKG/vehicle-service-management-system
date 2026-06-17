# Vehicle Service Management System

Welcome to the **Vehicle Service Management System**, a comprehensive, full-stack mobile application designed to streamline automotive service bookings and spare parts e-commerce.

This project bridges the gap between vehicle owners and service centers by providing a seamless, premium mobile experience for managing auto care.

## 🚀 Technology Stack

This project is built using a modern, scalable **MERN-inspired mobile stack**:

- **Frontend (Mobile App):** Built with **React Native** and powered by **Expo**. It utilizes `React Navigation` for smooth routing, `Axios` for API communication, and custom styling for a premium, native-feeling UI.
- **Backend (API Server):** A robust **Node.js** and **Express.js** RESTful API.
- **Database:** **MongoDB** (Atlas) accessed via **Mongoose** ODM for flexible and reliable data storage.
- **Authentication:** Secure **JSON Web Tokens (JWT)** handling encrypted user sessions and role-based access control (RBAC).

## ✨ Core Features

### 1. Advanced User Authentication
- Secure login and registration with encrypted passwords (`bcryptjs`).
- **Role-Based Access:** Distinct experiences for **Customers** (booking services, buying parts) and **Admins** (managing inventory, overseeing operations).
- Premium UI with dark mode (Black & Red aesthetic) featuring animated transitions.

### 2. Spare Parts E-Commerce
- **Browse & Search:** Customers can view a catalog of vehicle spare parts with images and details.
- **Cart & Checkout:** Seamless order placement with real-time stock validation.
- **Order History & Tracking:** A dedicated Order History screen where users can track their purchases.
- **Automated Delivery Scheduler:** A background cron-like job (`deliveryScheduler.js`) that automatically updates order statuses in real-time (from *Pending* to *Shipped*, *Out for Delivery*, and *Delivered*).

### 3. Service Booking System
- **Schedule Services:** Customers can select specific automotive services and book available time slots.
- **Booking Management:** Users can view, edit, or cancel pending service appointments directly from their mobile dashboard.

### 4. Admin & Inventory Management
- **Dashboard Overview:** Comprehensive insights into active orders, bookings, and revenue.
- **Inventory Control:** Admins can monitor low-stock alerts and dynamically update the spare parts catalog.

### 5. Payment Integration
- Built-in support for **PayHere** payment gateways to handle secure transactions and session management.

## 📂 Project Structure

The repository is organized as a monorepo containing two main environments:

```text
/WMT
├── /backend                 # Node.js Express Server
│   ├── /config              # Database & environment configurations
│   ├── /controllers         # Core business logic
│   ├── /models              # MongoDB Database Schemas
│   ├── /routes              # API Endpoint definitions
│   ├── /utils               # Helpers (e.g., automated schedulers)
│   └── server.js            # Main entry point
│
└── /frontend                # React Native Expo App
    ├── /src
    │   ├── /api             # Axios configurations and endpoint functions
    │   ├── /components      # Reusable UI components (Buttons, Inputs)
    │   ├── /context         # Global state management (AuthContext)
    │   ├── /screens         # Main application views (Login, Dashboard, etc.)
    │   └── /utils           # Frontend helpers (Validation, formatting)
    └── App.jsx              # Mobile App Entry Point
```

## 🛠️ Deployment

- **Backend:** Configured to run seamlessly on cloud PaaS providers like **Railway** or Heroku. It includes dynamic port binding and smart DNS routing checks.
- **Frontend:** Powered by Expo, allowing for instant Over-The-Air (OTA) updates, local testing via the Expo Go app, and easy compilation into native `.apk` (Android) or `.ipa` (iOS) files.
- **Database:** Hosted on **MongoDB Atlas** for high availability and remote access.
