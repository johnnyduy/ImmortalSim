# Ta Mô Phỏng Trường Sinh Lộ

A text-based cultivation simulation roguelite game.

Core gameplay:
- The player lives through multiple lifetimes.
- Each run is a simulation.
- Death is permanent but some inheritance persists.
- The player slowly uncovers the truth of immortality.

Main gameplay loop:
1. Start new life
2. Random events occur by age
3. Player makes choices
4. Stats change
5. Player dies
6. Inheritance persists
7. Begin new simulation

Game style:
- Dark cultivation world (dark xianxia)
- Mysterious
- Highly replayable
- Minimalist UI
- Mobile-friendly

Core systems:
- Age progression
- Events
- Choices
- Stats
- Cultivation realm
- Inheritance system

Stats:
- Health
- Luck
- Comprehension
- Karma
- Cultivation

Cultivation realms:
- Mortal (Cultivation from 0 to 9.99)
- Qi Refinement (9 Layers from 1->9, 9th layer is Consummate. Minor bottlenecks at 3->4 and 6->7; major bottleneck at 9->Foundation. Layer thresholds scale exponentially by x, default 1.3)
- Foundation Establishment (3 sub-stages: Early, Middle, Late. Upon breakthrough to Foundation, cultivation resets to 0, local limit is 0 to 20)
- Golden Core (4 sub-stages: Early, Middle, Late, Consummate. Upon breakthrough, cultivation resets to 0, limit is 0 to 40)
- Nascent Soul (4 sub-stages: Early, Middle, Late, Consummate. Upon breakthrough, cultivation resets to 0)
- Manuals System: Upgrading manuals costs stats cultivation. Better manuals cost y% more cultivation to upgrade than basic manuals (e.g. y = 10%).

Player should feel:
- Every death matters
- Every run reveals secrets
- NPCs may remember previous loops
