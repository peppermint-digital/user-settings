/**
 * Welcher Eintrag ist der aktuelle? — die reinen Regeln, ohne React.
 *
 * Steht hier getrennt, damit sie ohne DOM und ohne Inertia pruefbar sind. Die
 * Komponente daneben tut nichts weiter, als sie auf den Seitenzustand
 * anzuwenden.
 */

/**
 * Die Verben, die Inertia kennt.
 *
 * Hier ausgeschrieben statt aus `@inertiajs/core` geholt: Diese Datei soll
 * ohne Inertia pruefbar bleiben. Die Liste ist Teil des HTTP-Vertrags und
 * aendert sich nicht.
 */
export type HttpVerb = 'get' | 'post' | 'put' | 'patch' | 'delete';

/** Ein Ziel, wie Inertia und Wayfinder es liefern. */
export type Ziel = string | { url: string; method?: HttpVerb };

/**
 * Nur der Pfad, ohne Abfragezeichenkette und ohne Sprungmarke.
 *
 * Das ist der Grund, warum diese Funktion ueberhaupt existiert:
 * `usePage().url` traegt die Abfragezeichenkette mit, und ein Aufruf von
 * `/settings/profile?tab=sicherheit` wuerde dann keinen Eintrag mehr
 * hervorheben — die Navigation sieht aus, als stehe man nirgends. Im Manager
 * war dafuer ein eigener Umweg ueber `ziggy.location` gebaut; die Regel
 * gehoert einmal hierher statt vier Mal in die Produkte.
 *
 * Der abschliessende Schraegstrich fliegt mit raus, damit `/settings/` und
 * `/settings` derselbe Ort sind — aber nicht bei der Wurzel, sonst bleibt die
 * leere Zeichenkette uebrig.
 */
export function pfadVon(ziel: Ziel): string {
    const roh = typeof ziel === 'string' ? ziel : ziel.url;
    const ohneAnhang = (roh.split('#')[0] ?? '').split('?')[0] ?? '';

    // Eine vollstaendige Adresse kommt vor, wenn ein Produkt `route()` mit
    // absoluter Ausgabe benutzt. Den Rumpf abschneiden, nicht daran scheitern.
    const ohneRumpf = ohneAnhang.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*/i, '');

    if (ohneRumpf === '' || ohneRumpf === '/') {
        return '/';
    }

    return ohneRumpf.replace(/\/+$/, '');
}

/**
 * Trifft dieser Eintrag den aktuellen Pfad?
 *
 * Vorgabe ist der genaue Treffer. `aufPraefix` ist fuer einen Eintrag, hinter
 * dem Unterseiten liegen (`/settings/email-accounts/7/bearbeiten` soll
 * „E-Mail-Konten" hervorheben). Bewusst nicht die Vorgabe: Mit Praefix-Logik
 * ueberall wuerde ein kurzer Pfad jeden laengeren mitnehmen, und bei
 * `/settings` waeren schlicht alle Eintraege aktiv.
 */
export function istAktiv(ziel: Ziel, aktuellerPfad: string, aufPraefix = false): boolean {
    const eintrag = pfadVon(ziel);
    const jetzt = pfadVon(aktuellerPfad);

    if (eintrag === jetzt) {
        return true;
    }

    // Nur auf Segmentgrenze, sonst wuerde `/settings/mail` auch
    // `/settings/mailbox` beanspruchen.
    return aufPraefix && eintrag !== '/' && jetzt.startsWith(`${eintrag}/`);
}
