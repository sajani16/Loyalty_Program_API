# WebSocket Implementation - Real-Time Loyalty Dashboard

## Overview

Socket.IO is implemented for real-time notifications between customers and merchants during the loyalty QR flow.

**Key Flow:**
1. Customer scans QR → Creates pending loyalty request
2. Backend emits `request:new` via WebSocket → Merchant dashboard updates in real-time
3. Merchant completes request → Backend emits `request:completed` → Dashboard updates
4. No manual polling needed - everything is real-time

---

## Architecture

### Namespace Structure
```
/loyalty
  ├── Merchant connections
  ├── Real-time request notifications
  └── Loyalty updates
```

### Room Strategy
```
business:${businessId}
  ├── All merchants of this business join this room
  ├── Receive all customer requests for that business
  └── Get real-time updates for their customers
```

---

## Server Setup

### 1. Initialization (src/index.js)

```javascript
import http from "http";
import { initializeLoyaltySocket } from "./websocket/loyaltySocket.js";

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = initializeLoyaltySocket(httpServer);

// Make io globally available for services
global.io = io;

// Start server with WebSocket support
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}`);
});
```

### 2. Socket.IO Configuration

**Features:**
- Authentication middleware (JWT verification)
- CORS enabled
- Reconnection support
- Fallback to polling
- Error handling

---

## Client-Side Implementation

### Connect to WebSocket

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:4000/loyalty", {
  auth: {
    token: localStorage.getItem("jwtToken"), // JWT from login
  },
});
```

### Merchant: Join Dashboard

```javascript
// When merchant opens dashboard
socket.emit("merchant:join", { businessId }, (response) => {
  if (response.success) {
    console.log("Connected to dashboard");
    console.log(`Active merchants: ${response.activeConnections}`);
  }
});
```

### Listen to Events

```javascript
// NEW REQUEST FROM CUSTOMER
socket.on("request:new", (requestData) => {
  console.log("New QR request received:", requestData);
  /*
  requestData = {
    requestId: "LR_001",
    businessCustomerId: "BC_001",
    customer: {
      id: "CUST_001",
      email: "john@example.com",
      name: "John Doe"
    },
    loyalty: {
      points: 100,
      tier: "basic",
      stampCards: [...]
    },
    expiresAt: "2025-08-12T14:30:00Z",
    timestamp: "2025-08-11T10:30:00Z"
  }
  */

  // Update UI - show new request in pending list
  displayNewRequest(requestData);
});

// REQUEST COMPLETED
socket.on("request:completed", (completionData) => {
  console.log("Request completed:", completionData);
  /*
  completionData = {
    requestId: "LR_001",
    status: "completed",
    type: "stamp" | "point",
    loyalty: {
      pointsAwarded: 45,
      stampsAwarded: 1,
      newPoints: 145,
      newTier: "basic",
      stampCards: [...]
    },
    timestamp: "2025-08-11T10:35:00Z"
  }
  */

  // Update UI - move from pending to completed, show rewards
  updateRequestCompletion(completionData);
});

// REQUEST REJECTED
socket.on("request:rejected", (rejectionData) => {
  console.log("Request rejected:", rejectionData);
  /*
  rejectionData = {
    requestId: "LR_001",
    status: "rejected",
    reason: "Duplicate transaction",
    timestamp: "2025-08-11T10:35:00Z"
  }
  */

  // Update UI - remove from pending list
  removeRejectedRequest(rejectionData.requestId);
});

// HEARTBEAT
socket.on("ping", () => {
  socket.emit("ping", (response) => {
    console.log("Connection alive:", response);
  });
});

// ERROR
socket.on("error", (error) => {
  console.error("WebSocket error:", error);
});

// DISCONNECT
socket.on("disconnect", () => {
  console.log("Disconnected from server");
  // Show reconnection UI
});
```

---

## Backend: Emitting Events

### From Services

#### 1. When Customer Scans QR (businesscustomer.services.js)

```javascript
import { emitNewLoyaltyRequest } from "../websocket/loyaltySocket.js";

export const createQuickLoyaltyRequestViaQR = async (customerId, businessId) => {
  // ... create loyalty request ...

  // Emit to merchants
  if (global.io) {
    emitNewLoyaltyRequest(global.io, businessId, {
      requestId: loyaltyRequest._id.toString(),
      businessCustomerId: businessCustomer._id.toString(),
      customerId: customer._id.toString(),
      customerEmail: customer.email,
      customerName: customer.name,
      currentPoints: businessCustomer.points,
      currentTier: businessCustomer.tier,
      stampCards: businessCustomer.stampCards,
      expiresAt: expiresAt.toISOString(),
    });
  }

  return result;
};
```

#### 2. When Request is Completed (loyaltyrequest.services.js)

```javascript
import { emitRequestCompleted } from "../websocket/loyaltySocket.js";

export const completeLoyaltyRequest = async (businessId, requestId, completionData) => {
  // ... complete request and update customer ...

  // Emit to merchants
  if (global.io) {
    emitRequestCompleted(global.io, businessId, {
      requestId: updated._id.toString(),
      type: completionData.type,
      pointsAwarded,
      stampsAwarded,
      customerUpdate: {
        newPoints,
        newTier,
        stampCards: updatedStampCards,
      },
    });
  }

  return result;
};
```

#### 3. When Request is Rejected (loyaltyrequest.services.js)

```javascript
import { emitRequestRejected } from "../websocket/loyaltySocket.js";

export const rejectLoyaltyRequest = async (businessId, requestId, reason) => {
  // ... reject request ...

  // Emit to merchants
  if (global.io) {
    emitRequestRejected(global.io, businessId, requestId.toString(), reason || "");
  }

  return result;
};
```

---

## Complete Flow Example

### 1. Customer Side: Scan QR

```
Customer App
  ├─ Scan QR code (contains businessId)
  ├─ Login check (if needed)
  ├─ POST /api/loyalty-requests/qr-scan/BUS_123
  │   ├─ Backend creates loyalty request
  │   ├─ Emits via WebSocket
  │   └─ Returns requestId
  └─ Shows "Request sent to merchant"
```

### 2. Merchant Side: Receive in Real-Time

```
Merchant Dashboard (WebSocket connected)
  ├─ Listening on /loyalty namespace
  ├─ Joined room: business:BUS_123
  │
  ├─ Receives: request:new event
  │   ├─ requestId: LR_001
  │   ├─ Customer: John Doe, 100 points, basic tier
  │   ├─ Expiry: 24 hours
  │   └─ UI Updates instantly (no page refresh needed)
  │
  └─ Merchant processes (selects products or amount)
     ├─ PATCH /api/loyalty-requests/LR_001/complete
     ├─ Backend calculates loyalty
     ├─ Emits via WebSocket: request:completed
     └─ Dashboard updates (shows rewards, removes from pending)
```

---

## Event Payloads

### request:new
```json
{
  "requestId": "LR_001",
  "businessCustomerId": "BC_001",
  "customer": {
    "id": "CUST_001",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "loyalty": {
    "points": 100,
    "tier": "basic",
    "stampCards": [
      {
        "productId": "PROD_1",
        "progress": 3,
        "completedCards": 0
      }
    ]
  },
  "expiresAt": "2025-08-12T14:30:00Z",
  "timestamp": "2025-08-11T10:30:00Z"
}
```

### request:completed
```json
{
  "requestId": "LR_001",
  "status": "completed",
  "type": "stamp",
  "loyalty": {
    "pointsAwarded": 45,
    "stampsAwarded": 1,
    "newPoints": 145,
    "newTier": "basic",
    "stampCards": [
      {
        "productId": "PROD_1",
        "progress": 5,
        "completedCards": 0
      }
    ]
  },
  "timestamp": "2025-08-11T10:35:00Z"
}
```

### request:rejected
```json
{
  "requestId": "LR_001",
  "status": "rejected",
  "reason": "Duplicate transaction",
  "timestamp": "2025-08-11T10:35:00Z"
}
```

---

## Troubleshooting

### Connection Issues

**Problem:** "Authentication token required"
```
Solution: Ensure JWT token is passed in auth on client:
const socket = io("...", {
  auth: { token: localStorage.getItem("jwtToken") }
});
```

**Problem:** Connection keeps dropping
```
Solution: Check reconnection settings in socket initialization:
- reconnection: true
- reconnectionDelay: 1000
- reconnectionAttempts: 5
```

### Events Not Received

**Problem:** Merchant not receiving request:new
```
Solution: Verify merchant is in correct room:
1. Check businessId matches
2. Verify merchant:join was called with callback
3. Check browser console for errors
```

**Problem:** Multiple merchants see duplicate events
```
Solution: This is correct behavior!
All merchants in business:${businessId} room receive the event.
Use requestId to prevent duplicate processing.
```

---

## Performance Considerations

1. **Connection Pooling**
   - Multiple merchants can connect from same business
   - Each gets their own socket connection
   - Scales to many concurrent connections

2. **Message Broadcasting**
   - Events only broadcast to room (efficient)
   - Not sent to every user globally
   - Minimal server overhead

3. **Disconnection Handling**
   - Automatic cleanup on disconnect
   - Reconnection attempts (configurable)
   - Graceful fallback to polling

4. **Security**
   - JWT validation on every connection
   - Token expiry respected
   - Only authenticated users can connect

---

## Testing WebSocket

### Using Socket.IO Client Library

```javascript
// Terminal 1: Start server
npm run dev

// Terminal 2: Test client
node test-websocket.js
```

### Test Script (test-websocket.js)

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:4000/loyalty", {
  auth: {
    token: "YOUR_JWT_TOKEN_HERE"
  }
});

socket.on("connect", () => {
  console.log("✓ Connected");

  // Join as merchant
  socket.emit("merchant:join", { businessId: "BUS_123" }, (res) => {
    console.log("✓ Joined merchant dashboard:", res);
  });
});

socket.on("request:new", (data) => {
  console.log("✓ New request received:", data);
});

socket.on("request:completed", (data) => {
  console.log("✓ Request completed:", data);
});

socket.on("disconnect", () => {
  console.log("✗ Disconnected");
});
```

---

## Summary

✅ **Real-time notifications** - No polling needed
✅ **Multiple merchants** - All see updates instantly
✅ **Secure** - JWT authenticated
✅ **Reliable** - Automatic reconnection
✅ **Scalable** - Namespace + room architecture
✅ **Simple** - Emit from services, listen on client
