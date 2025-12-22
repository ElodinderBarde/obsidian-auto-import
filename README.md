# CppEmbed-AutoImport (QuickAdd Script)

Dieses Script wird nach und nach, nach bedarf weiter ausgebaut. Wer hier zufällig drüber stolpert, bitte lest euch alles sorgfälltig durch ,da es einige speziefische Anforderungen hat. 

Ein **QuickAdd-Macro-Script für Obsidian**, das automatisch eine vollständige, strukturierte **Code-Dokumentation** aus einem Projektordner erzeugt.

Ursprünglich für **C++ / MFC** konzipiert, unterstützt das Script inzwischen **mehrere Projektprofile** (C++, Java, Kotlin, Node/Vite) und passt sein Verhalten **dynamisch** an Projektstruktur und Sprachkontext an.

Das Script scannt einen definierten `Quellcode/`-Ordner und erzeugt Markdown mit:

* Überschriftenhierarchie
* internen Links
* `embed-*`-Code-Einbettungen
  ideal für Lern-, Analyse- und Abgabe-Notizen.

---

##  Neue & erweiterte Features (aktuelle Version)

### 🔁 Profilbasiertes Verhalten

Das Script arbeitet **profilgesteuert**:

| Profil       | Erkennung                             |
| ------------ | ------------------------------------- |
| `cpp_mfc`    | `Source/`, `Include/`, `res/`, `x64/` |
| `java`       | `pom.xml`, `src/main/java`            |
| `javakotlin` | `src/main/kotlin`                     |
| `node`       | `package.json`, `vite.config.*`       |

Das aktive Profil wird ermittelt über:

1. **Language-Tag im Markdown** (falls vorhanden)
2. **Projektstruktur**
3. Fallback: `cpp_mfc`

---

###  Unterstützte Projektarten

* **C++ / MFC / Visual Studio**
* **Java (Maven)**
* **Java + Kotlin**
* **Node / Vite / React**

Ein Projekt kann zusätzlich ein **Frontend (Vite)** enthalten, das automatisch erkannt und separat dokumentiert wird.

---

###  Intelligente Root-Erkennung

* Segmentweise, **case-insensitive** Ordnerauflösung
  (`Source`, `source`, `SOURCE` → gültig)
* Kein hartes `path.join` mehr
* Stabil auf Windows, macOS, Linux

---

###  Saubere Abschnittslogik

Automatisch erzeugt:

* `# Erarbeitete Lösung`
* `## Main` (profilabhängig)
* `## Include`
* `## Source`
* `## Resources`
* `## Config`
* `## Container`
* `## Assets`
* `## Debug / Release` (C++)

Nicht relevante Dateien landen gesammelt unter:

* `## Weitere Dateien`

---

###  Ressourcen & Assets (neu)

**C++ / MFC:**

* `.rc`, `.rc2` → **Resources**
* `.ico`, `.bmp` → **Assets** (als Bildvorschau)
* saubere Trennung von Code und Binärressourcen

**Node / Frontend:**

* Bilder (`.png`, `.svg`, `.jpg`, …) → **Assets**
* Kein versehentliches Einbetten von Binärdateien als Code

---

###  Config-Dateien (profilübergreifend)

Automatische Erkennung und Dokumentation von z. B.:

* `CMakeLists.txt`
* `.editorconfig`
* `pom.xml`
* `application.yml`
* `package.json`
* `vite.config.ts`

Diese erscheinen gesammelt unter **Config** – unabhängig vom Profil.

---

##  Erwartete Projektstruktur (C++ / MFC)

```text
Quellcode/
├── Include/
│   └── ProjectName/
├── Source/
│   └── ProjectName/
│       └── main.cpp
├── res/
│   ├── *.rc
│   └── *.ico
├── x64/
│   ├── Debug/
│   └── Release/
```

> Der Projektname wird **automatisch erkannt**
> (erstes Unterverzeichnis von `Source` / `Include`).

---

##  Verwendung

### Voraussetzungen

* Obsidian (Desktop)
* **QuickAdd Plugin**
* **Embed Code File Plugin**

---

### Einrichtung in QuickAdd

1. **QuickAdd → Macros → New Macro**
2. JavaScript-Datei auswählen:

   ```text
   CppEmbed-AutoImport.js
   ```
3. Macro z. B. nennen:
   **„Codebasis importieren“**
4. Optional Shortcut vergeben

---

### Ausführung

* Markdown-Datei öffnen
* Cursor an gewünschte Stelle setzen
* QuickAdd-Macro ausführen

Das Script ersetzt die Selektion durch eine **vollständige Projektdokumentation**.

---

##  Zentrale Konfiguration (im Script)

```js
const ROOT_DIR_NAME = "Quellcode";
const MAX_HEADING_LEVEL = 6;
```

Alle weiteren Regeln sind **profilgesteuert** über:

```js
const PROJECT_PROFILES = { ... }
```

---

##  Technische Details

* Reines **QuickAdd-JavaScript**
* Kein eigenes Obsidian-Plugin
* Zugriff über Node (`fs`, `path`)
* POSIX-Pfadnormalisierung
* Keine globalen Seiteneffekte
* Deterministische Ausgabe

---

##  Bekannte Einschränkungen

* Nur **Desktop**
* Reales Dateisystem erforderlich
* `embed-*` Plugins müssen installiert sein
* Keine GUI-Konfiguration (bewusst → Versionierbarkeit)

---

## Autor

**Elodin**



sauber daraus ableiten.
