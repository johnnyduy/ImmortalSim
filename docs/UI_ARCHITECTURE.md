# ImmortalSim UI Architecture Naming Conventions

This document defines the standard naming conventions for the UI structure in the game, particularly focusing on TerminalUI.tsx. Using consistent terminology helps streamline development and communication.

## 1. TerminalUI (Root Container)
The primary overarching container that manages the full-screen terminal-style interface.

## 2. Structural Regions

### Header Bar (Top)
- **Description**: The top horizontal bar.
- **Contents**: Basic identity information (e.g., character name), system time (SYS_TIME), and the active tab/view title.

### Left HUD / Vital Panel (Left Sidebar)
- **Description**: The left vertical pane, visible by default.
- **Contents**: Vital signs such as Cultivation (Tu Vi), HP, Dao Heart (Ð?o Tâm), Spiritual Root (Linh Can), and Sect stats.

### Center Panel / Main View (Middle Pane)
- **Description**: The core interactive and central area. It is dynamic and changes based on the context.
- **Views**: 
  - **System Log (Nh?t Ký S? Ki?n)**: The default view showing the chronologic flow of game events.
  - **Explore View (Khu v?c thám hi?m)**: Views like MountainExploration (V?n Thú Son M?ch) which temporarily override the System Log.
  - **Sub-menus**: Special localized menus like Herb Garden (Du?c viên), Bug Room (Trùng th?t).

### Right Panel / Sidebar (Right Sidebar)
- **Description**: The right vertical pane.
- **Contents**: Supplementary management interfaces.
- **Sub-tabs**: 
  - **Inventory (Hành trang)**: Item management.
  - **Bulletin (B?ng tin)**: System/Heavenly Dao announcements.

### Action Footer (Bottom)
- **Description**: The horizontal bar at the very bottom.
- **Contents**: Hotkeys and quick navigation buttons (e.g., [F1] to [F6]).

## 3. Modals & Overlays
- **Modals**: Popups that fully or partially obscure the UI and halt background interaction until resolved. 
  - Examples: CombatModal, AlchemyModal, BlackMarketModal.
- **Overlays**: Special fullscreen views that might sit on top of everything but aren't standard component views. (Note: Modals are often overlays, but try to use Center Panel Overrides for gameplay systems where possible so the player can still access their HUD and Inventory).
