graph TD
    subgraph Client_Frontend ["Frontend (React + Vite)"]
        UI[User Interface / Pages]
        State[Component State]
        Service[API Service Layer - api.ts]
    end

    subgraph Server_Backend ["Backend (Express.js)"]
        Route[Express Routes]
        Logic[Business Logic - server.js]
        FS[Node File System - fs]
    end

    subgraph Data_Storage ["Storage"]
        DB[(database.json)]
    end

    %% Flow
    UI --> State
    State --> Service
    Service -- "Fetch API (JSON)" --> Route
    Route --> Logic
    Logic --> FS
    FS --> DB
    DB -- "Stream Data" --> Logic
    Logic -- "Response" --> Service
    Service -- "Update State" --> UI