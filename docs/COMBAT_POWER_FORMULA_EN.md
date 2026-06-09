# Combat Power (CP) Calculation Formula (ImmortalSim)

This document describes how combat power (CP) and combat stats are derived from the player's core simulation attributes across different realms and sub-stages.

---

## 1. Simulation to Combat Stat Mapping

To determine a cultivator's combat stats, we map their simulation attributes to combat attributes:

*   **Max HP**: Represents the cultivator's physical vitality.
    $$\text{Max HP} = 20 + \lfloor\frac{\text{Blessing}}{2}\rfloor + \text{Realm HP Bonus} + \text{Equipment HP Bonus}$$
*   **Max Qi**: Represents the capacity of the cultivator's dantian.
    $$\text{Max Qi} = 60 + \text{Realm Qi Bonus} + \text{Equipment Qi Bonus}$$
*   **Attack**: Represents physical/spiritual damage output.
    $$\text{Attack} = 15 + \lfloor\text{Cultivation} \times 0.4\rfloor + \text{Realm Attack Bonus} + \text{Equipment Attack Bonus}$$
*   **Speed**: Determines action delay in ticks.
    $$\text{Speed} = 10 + \lfloor\text{Luck} \times 0.2\rfloor + \text{Equipment Speed Bonus}$$
*   **Qi Control**: Amplifies defensive abilities and specific flame/lotus technique effectiveness.
    $$\text{Qi Control} = 10 + \lfloor\text{Dao Heart} \times 0.15\rfloor + \text{Equipment Defense Bonus}$$
*   **Comprehension**: Directly mapped from the simulation ngộ tính (`comprehension`).
    $$\text{Comprehension} = \text{Comprehension}$$

---

## 2. Combat Power (CP) Formula

The total Combat Power (CP) is calculated using a unified formula:

$$CP = \text{Max HP} \times 0.5 + \text{Attack} \times 3.0 + \text{Speed} \times 2.0 + \text{Qi Control} \times 1.5 + \text{Comprehension} \times 1.0 + \text{Max Qi} \times 0.3 + \text{SubStageIndex} \times 25$$

Where `SubStageIndex` represents the cultivator's exact sub-stage on a scale of `0` to `24`:

| Index | Major Realm | Sub-Stage / Layer |
| :--- | :--- | :--- |
| **0** | Mortal | Phàm Nhân (Mortal) |
| **1 - 11** | Qi Refinement | Qi Refinement Layers 1 to 11 |
| **12** | Qi Refinement | Qi Refinement Layer 12 (Consummate) |
| **13** | Foundation Establishment | Foundation Establishment Early (Sơ Kỳ) |
| **14** | Foundation Establishment | Foundation Establishment Middle (Trung Kỳ) |
| **15** | Foundation Establishment | Foundation Establishment Late (Hậu Kỳ) |
| **16** | Foundation Establishment | Foundation Establishment Consummate (Viên Mãn) |
| **17** | Golden Core | Golden Core Early (Sơ Kỳ) |
| **18** | Golden Core | Golden Core Middle (Trung Kỳ) |
| **19** | Golden Core | Golden Core Late (Hậu Kỳ) |
| **20** | Golden Core | Golden Core Consummate (Viên Mãn) |
| **21** | Nascent Soul | Nascent Soul Early (Sơ Kỳ) |
| **22** | Nascent Soul | Nascent Soul Middle (Trung Kỳ) |
| **23** | Nascent Soul | Nascent Soul Late (Hậu Kỳ) |
| **24** | Nascent Soul | Nascent Soul Consummate (Viên Mãn) |

---

## 3. Realm and Sub-stage Stat Bonuses

Each sub-stage grants incremental static stat bonuses:

*   **Mortal** (Cultivation 0 - 14):
    *   HP Bonus: +0, Qi Bonus: +0, Attack Bonus: +0
*   **Qi Refinement** (Cultivation 15 - 29):
    *   HP Bonus: $+\text{Layer} \times 2$
    *   Qi Bonus: $+\text{Layer} \times 2$
    *   Attack Bonus: $+\text{Layer} \times 0.5$
*   **Foundation Establishment** (Cultivation 30 - 49):
    *   *Early*: HP +35, Qi +30, Attack +8
    *   *Middle*: HP +45, Qi +40, Attack +10.5
    *   *Late*: HP +55, Qi +50, Attack +13
    *   *Consummate*: HP +65, Qi +60, Attack +15.5
*   **Golden Core** (Cultivation 50 - 89):
    *   *Early*: HP +80, Qi +70, Attack +18
    *   *Middle*: HP +95, Qi +85, Attack +21.5
    *   *Late*: HP +110, Qi +100, Attack +25
    *   *Consummate*: HP +125, Qi +115, Attack +28.5
*   **Nascent Soul** (Cultivation 90+):
    *   *Early*: HP +150, Qi +140, Attack +35
    *   *Middle*: HP +180, Qi +170, Attack +42
    *   *Late*: HP +210, Qi +200, Attack +49
    *   *Consummate*: HP +250, Qi +240, Attack +58
