# HOW DID I END UP HERE — VHS Edition

*Nach Hause von der Party kommen. 3 Tapes. 3 Räusche. Aliens inklusive.*

## Starten

Einfach **`index.html` doppelklicken** — läuft direkt im Browser (Chrome/Edge/Firefox), kein Server, kein Internet nötig.

## Steuerung

| Taste | Aktion |
|---|---|
| **W A S D** | Laufen |
| **Maus** | Umsehen |
| **Linksklick** | Schießen |
| **Shift** | Sprinten |
| **R** | Nachladen |
| **ESC** | Pause |

## Die 3 Level

1. **KIFFER-FREUNDESKREIS (Weed)** — Alles schwebt, die Zeit ist zäh, und die MUNCHIES fressen deine Lebensleiste. Sammle Döner!
2. **PARTY-CLIQUE (Alkohol)** — Du schwankst, siehst doppelt und stolperst. Wasser senkt den Promille-Pegel. *(Wird nach Level 1 freigeschaltet)*
3. **VIP-HINTERZIMMER (Koks)** — Alles auf 1.5x Speed, dein Herz hämmert und der CRASH-Timer läuft. Erreich dein Bett, bevor er abläuft. *(Wird nach Level 2 freigeschaltet)*

Unterwegs: **Aliens abknallen**, Döner (+30 Leben) und Wasser (kurz klar sehen) einsammeln, UFOs ausweichen — und einfach das leuchtende **ZUHAUSE**-Schild erreichen.

## Technik

- Three.js (lokal, `three.min.js`) — komplett offline lauffähig
- Alle 3D-Modelle prozedural gebaut, alle Sounds & Musik live per WebAudio synthetisiert — keine Asset-Dateien
- VHS-Look über einen eigenen Post-Processing-Shader (Scanlines, Rauschen, Chromatic Aberration, Tracking-Glitches) + Rausch-Effekte pro Level (Wobble, Doppeltsehen, Herzschlag-Puls)
- Fortschritt wird im Browser gespeichert (localStorage)

*Satire. Im echten Leben: Drogen ruinieren jeden Heimweg. 18+*
