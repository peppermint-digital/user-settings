import { Link, usePage } from '@inertiajs/react';
import type { ComponentType, ReactNode } from 'react';
import { istAktiv, type Ziel } from './aktiv';
import { cn } from './ui/utils';

/**
 * Der Rahmen aller Nutzer-Einstellungen — in jedem Produkt derselbe.
 *
 * ## Warum eine Top-Bar und keine Seitenspalte
 *
 * Bis zum 21.10.2026 hatte jedes der vier Produkte eine eigene, zweite
 * Sidebar INNERHALB der App-Sidebar. Ein Menue im Menue: Die Augen springen
 * zweimal nach links, und auf schmalen Geraeten klappt die zweite Liste als
 * Block ueber den Inhalt. Die Einstellungen sind ausserdem ein flacher Raum
 * mit fuenf bis neun Punkten — dafuer ist eine waagerechte Leiste die
 * ehrlichere Form, und sie gibt dem Inhalt die ganze Breite zurueck.
 *
 * ## Was hier liegt und was beim Produkt bleibt
 *
 * Hier liegt die Anordnung samt Verdrahtung: die Leiste, das Scrollen bei
 * Platzmangel, die Erkennung des aktiven Eintrags, der Inhaltsbereich.
 *
 * Beim Produkt bleiben **die Worte und die Adressen** — also `items`, und
 * welche davon ein Mensch ueberhaupt sehen darf. Letzteres ist kein
 * Schoenheitsfehler, sondern Absicht: Im AI Brain ist der Avatar ein pro
 * Nutzer freigeschaltetes Plugin, und ein fest eingebauter Menuepunkt fuehrte
 * jeden ohne dieses Plugin auf eine 404. Das Paket kann das nicht wissen; das
 * Produkt filtert, bevor es die Liste uebergibt.
 */
export interface SettingsNavItem {
    /** Die Aufschrift. Das Paket uebersetzt nicht. */
    title: string;
    /** Das Ziel — Zeichenkette, oder das `{url, method}` von Wayfinder. */
    href: Ziel;
    /** Optionales Symbol, z. B. aus `lucide-react`. */
    icon?: ComponentType<{ className?: string }>;
    /**
     * Auch bei Unterseiten hervorheben. Fuer Eintraege, hinter denen weitere
     * Seiten liegen — siehe {@link istAktiv}.
     */
    matchPrefix?: boolean;
}

export interface SettingsShellProps {
    items: SettingsNavItem[];
    /** Ueberschrift. Vorgabe absichtlich deutsch — die Produkte sind deutsch. */
    title?: string;
    description?: string;
    /**
     * Ueberschreibt die Pfaderkennung. Im Normalfall weglassen: Das Paket
     * liest den Pfad selbst aus dem Seitenzustand und schneidet die
     * Abfragezeichenkette ab.
     */
    currentPath?: string;
    /** Breite des Inhalts. Vorgabe passt fuer Formularseiten. */
    contentClassName?: string;
    /**
     * Die Zielseiten beim Darueberfahren schon holen.
     *
     * Vorgabe AUS, und das ist bewusst keine Geschmacksfrage: CRM und
     * Verwaltung hatten `prefetch` an ihren Eintraegen, AI Brain und Manager
     * nicht. Waere das Holen hier die Vorgabe, haetten zwei Produkte beim
     * Umzug auf diese Schale stillschweigend ein anderes Ladeverhalten
     * bekommen — eine Aenderung, die niemand bestellt hat und die man erst
     * am Netzwerkverkehr merkt.
     *
     * Wer es will, schaltet es ein. Siehe auch das Prinzip dahinter: Beim
     * Heben einer Funktion ins Paket wird jede Sonderbehandlung einzeln
     * entschieden, nicht weggelassen, weil kein Test rot wird.
     */
    prefetch?: boolean;
    children: ReactNode;
    className?: string;
}

export function SettingsShell({
    items,
    title = 'Einstellungen',
    description,
    currentPath,
    contentClassName,
    prefetch = false,
    children,
    className,
}: SettingsShellProps) {
    const seite = usePage();
    const pfad = currentPath ?? seite.url;

    return (
        <div className={cn('px-4 py-6', className)}>
            <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>

            {items.length > 0 && (
                <nav
                    aria-label="Einstellungen"
                    /* `overflow-x-auto` statt Umbruch: Eine Leiste, die in
                       zwei Zeilen umbricht, verschiebt den Inhalt darunter je
                       nach Fensterbreite. Scrollen haelt die Hoehe stabil.
                       `scrollbar-none` gibt es nicht ueberall — deshalb nur
                       eine duenne Trennlinie, die das Ende andeutet. */
                    className="mt-4 -mb-px flex gap-1 overflow-x-auto border-b"
                >
                    {items.map((item, index) => {
                        const aktiv = istAktiv(item.href, pfad, item.matchPrefix);
                        const Symbol = item.icon;

                        // Inertias `href` verlangt bei der Objektform ein
                        // gesetztes `method`; unsere Angabe laesst es
                        // weg, weil ein Menuepunkt praktisch immer ein
                        // `get` ist. Hier einmal auffuellen, statt es
                        // jedem Produkt aufzuschreiben.
                        const ziel =
                            typeof item.href === 'string'
                                ? item.href
                                : { url: item.href.url, method: item.href.method ?? 'get' };

                        return (
                            <Link
                                key={`${typeof ziel === 'string' ? ziel : ziel.url}-${index}`}
                                href={ziel}
                                prefetch={prefetch}
                                aria-current={aktiv ? 'page' : undefined}
                                className={cn(
                                    'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                    aktiv
                                        ? 'border-primary text-foreground'
                                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                                )}
                            >
                                {Symbol && <Symbol className="h-4 w-4" />}
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            )}

            {/*
             * Volle Breite, und `min-w-0` dazu.
             *
             * Die alten Layouts steckten den Inhalt in `max-w-xl` innerhalb
             * von `md:max-w-2xl` — eine Enge, die aus der Zeit stammt, in der
             * links noch eine Seitenspalte stand. Mit der Leiste oben ist sie
             * nur noch im Weg: Breite Dinge wie die Benachrichtigungs-Matrix
             * wurden links und rechts abgeschnitten, und die uebrigen Seiten
             * der Produkte laufen ohnehin auf voller Breite.
             *
             * `min-w-0` ist der Teil, den man leicht vergisst: Ohne ihn
             * weigert sich ein Flex- oder Grid-Kind zu schrumpfen und schiebt
             * stattdessen den Inhalt aus dem Rahmen — genau das Abschneiden,
             * das weg soll.
             *
             * Wer eine Seite doch schmal will, setzt `contentClassName`.
             */}
            <div className={cn('mt-6 min-w-0 space-y-12', contentClassName)}>{children}</div>
        </div>
    );
}

export default SettingsShell;
