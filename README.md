# @peppermint-digital/user-settings

Die Schale der Nutzer-Einstellungen — eine Top-Bar statt einer zweiten Sidebar, in jedem
Produkt dieselbe.

## Warum es das gibt

Am 21.10.2026 gemessen: Alle vier Produkte (AI Brain, Manager, CRM, Verwaltung) hatten
`resources/js/layouts/settings/layout.tsx` mit derselben Form — `<aside>`, Nav, Inhalt —
zwischen 59 und 118 Zeilen, mit 5 bis 9 Einträgen. Vier Mal dieselbe Verdrahtung. Damit
stand die dritte Prüffrage des Paket-Vertrags auf „ja": *Schreibt jedes Produkt denselben
Verdrahtungscode?*

Dazu kam der Grund, der die Form ändert: Diese zweite Sidebar lag **innerhalb** der
App-Sidebar. Ein Menü im Menü. Die Einstellungen sind ein flacher Raum mit wenigen
Punkten; dafür ist eine waagerechte Leiste die ehrlichere Form, und sie gibt dem Inhalt
die ganze Breite zurück.

## Es ist absichtlich nur ein npm-Paket

Kein Composer-Gegenstück. Der Paket-Vertrag verbietet Oberfläche im PHP-Paket
ausdrücklich (Regel 8, Abschnitt „Grenze"): *Frontend höchstens als eigenes npm-Paket,
nie im Composer-Paket.* Es gibt hier auch nichts zu teilen — die Einstellungsseiten
selbst (Profil, Kennwort, Zwei-Faktor, Darstellung) sind je Produkt verschieden.

## Benutzung

Das Produkt liefert **die Worte und die Adressen**, das Paket alles andere.

```tsx
import { SettingsShell, type SettingsNavItem } from '@peppermint-digital/user-settings';

const eintraege: SettingsNavItem[] = [
    { title: 'Profil', href: edit() },
    { title: 'Kennwort', href: editPassword() },
    { title: 'Benachrichtigungen', href: '/settings/notifications' },
    { title: 'E-Mail-Konten', href: emailAccounts(), matchPrefix: true },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    return (
        <SettingsShell items={eintraege} description="Profil und Zugang verwalten">
            {children}
        </SettingsShell>
    );
}
```

### Was beim Produkt bleibt

- **Die Einträge** — und welche davon jemand überhaupt sehen darf. Das ist kein
  Schönheitsfehler: Im AI Brain ist der Avatar ein pro Nutzer freigeschaltetes Plugin.
  Ein fest eingebauter Menüpunkt führte jeden ohne dieses Plugin auf eine 404. Das Paket
  kann das nicht wissen — das Produkt filtert, bevor es die Liste übergibt.
- **Die Überschrift**, wenn „Einstellungen" nicht passt.

### Was das Paket übernimmt

- Die Leiste samt Scrollen bei Platzmangel (nicht Umbruch — eine Leiste, die in zwei
  Zeilen umbricht, verschiebt den Inhalt darunter je nach Fensterbreite).
- Die Erkennung des aktiven Eintrags, **inklusive Abfragezeichenkette**. Das war vorher
  ein Fehler je Produkt: `usePage().url` trägt `?tab=…` mit, und dann hob
  `/settings/profile?tab=sicherheit` keinen Eintrag mehr hervor. Der Manager hatte dafür
  einen eigenen Umweg über `ziggy.location` gebaut; die Regel liegt jetzt einmal hier.
- `aria-current="page"` auf dem aktiven Eintrag und ein benanntes `<nav>`.

## matchPrefix

Vorgabe ist der genaue Treffer. `matchPrefix: true` ist für einen Eintrag, hinter dem
Unterseiten liegen — `/settings/email-accounts/7/bearbeiten` soll „E-Mail-Konten"
hervorheben. Bewusst nicht die Vorgabe: Mit Präfix-Logik überall nähme ein kurzer Pfad
jeden längeren mit, und bei `/settings` wären schlicht alle Einträge aktiv. Der Treffer
gilt außerdem nur auf Segmentgrenze, sonst beanspruchte `/settings/mail` auch
`/settings/mailbox`.

## Entwicklung

```bash
npm install          # Git-Abhängigkeiten: npm install --allow-git=all
npm run typecheck
npm test
npm run build
```

`react`, `react-dom` und `@inertiajs/react` sind Peer-Abhängigkeiten und bleiben beim
Produkt — zwei React- oder zwei Inertia-Instanzen im selben Baum enden in „Invalid hook
call" bzw. einem leeren Seitenzustand, und das findet niemand schnell.

## prefetch

Vorgabe **aus**. Beim Umzug der vier Produkte auf diese Schale hatten CRM und
Verwaltung `prefetch` an ihren Einträgen, AI Brain und Manager nicht. Wäre das
Vorabholen hier die Vorgabe, hätten zwei Produkte stillschweigend ein anderes
Ladeverhalten bekommen — eine Änderung, die niemand bestellt hat und die man erst am
Netzwerkverkehr merkt. Wer es will, schaltet es ein:

```tsx
<SettingsShell items={eintraege} prefetch>
```
