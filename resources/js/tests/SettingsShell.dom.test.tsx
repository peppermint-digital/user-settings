// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsShell } from '../src/SettingsShell';

/**
 * Inertia wird ersetzt, nicht gestartet: `usePage` liest aus einem Context,
 * den es ohne eine echte Inertia-App nicht gibt. Die Adresse ist der einzige
 * Teil des Seitenzustands, den die Schale anfasst.
 */
const seitenAdresse = { wert: '/settings/profile' };

vi.mock('@inertiajs/react', () => ({
    usePage: () => ({ url: seitenAdresse.wert }),
    Link: ({
        href,
        children,
        prefetch,
        ...rest
    }: {
        href: string | { url: string };
        children: ReactNode;
        prefetch?: boolean;
    }) => (
        // `prefetch` landet absichtlich als `data-`-Attribut und nicht
        // durchgereicht: Ein unbekanntes Attribut auf einem `<a>` wuerde React
        // nur eine Warnung entlocken, und pruefen laesst es sich so besser.
        <a href={typeof href === 'string' ? href : href.url} data-prefetch={String(prefetch)} {...rest}>
            {children}
        </a>
    ),
}));

const EINTRAEGE = [
    { title: 'Profil', href: '/settings/profile' },
    { title: 'Kennwort', href: '/settings/password' },
    { title: 'Benachrichtigungen', href: { url: '/settings/notifications', method: 'get' } },
];

afterEach(() => {
    // Ohne `cleanup()` bleibt der gerenderte Baum stehen und der naechste
    // Test sieht die Eintraege doppelt. Vitest raeumt nicht von selbst auf,
    // solange `globals` aus ist.
    cleanup();
    seitenAdresse.wert = '/settings/profile';
});

describe('SettingsShell', () => {
    it('zeigt die Eintraege als Leiste und den Inhalt darunter', () => {
        render(
            <SettingsShell items={EINTRAEGE}>
                <p>Inhalt der Seite</p>
            </SettingsShell>,
        );

        const leiste = screen.getByRole('navigation', { name: 'Einstellungen' });

        expect(leiste).toBeTruthy();
        expect(screen.getAllByRole('link')).toHaveLength(3);
        expect(screen.getByText('Inhalt der Seite')).toBeTruthy();
    });

    it('kennzeichnet genau einen Eintrag als den aktuellen', () => {
        render(
            <SettingsShell items={EINTRAEGE}>
                <p>x</p>
            </SettingsShell>,
        );

        const aktuelle = screen
            .getAllByRole('link')
            .filter((a) => a.getAttribute('aria-current') === 'page');

        expect(aktuelle).toHaveLength(1);
        expect(aktuelle[0]?.textContent).toBe('Profil');
    });

    /** Der Fall, an dem die alte Loesung scheiterte. */
    it('behaelt die Hervorhebung bei einer Abfragezeichenkette in der Adresse', () => {
        seitenAdresse.wert = '/settings/profile?tab=sicherheit';

        render(
            <SettingsShell items={EINTRAEGE}>
                <p>x</p>
            </SettingsShell>,
        );

        const aktuelle = screen
            .getAllByRole('link')
            .filter((a) => a.getAttribute('aria-current') === 'page');

        expect(aktuelle).toHaveLength(1);
        expect(aktuelle[0]?.textContent).toBe('Profil');
    });

    it('kommt mit einem Wayfinder-Ziel zurecht', () => {
        seitenAdresse.wert = '/settings/notifications';

        render(
            <SettingsShell items={EINTRAEGE}>
                <p>x</p>
            </SettingsShell>,
        );

        const aktuelle = screen
            .getAllByRole('link')
            .filter((a) => a.getAttribute('aria-current') === 'page');

        expect(aktuelle[0]?.textContent).toBe('Benachrichtigungen');
    });

    it('zeigt Ueberschrift und Beschreibung des Produkts', () => {
        render(
            <SettingsShell items={EINTRAEGE} title="Mein Konto" description="Profil und Zugang">
                <p>x</p>
            </SettingsShell>,
        );

        expect(screen.getByRole('heading', { name: 'Mein Konto' })).toBeTruthy();
        expect(screen.getByText('Profil und Zugang')).toBeTruthy();
    });

    /**
     * CRM und Verwaltung hatten `prefetch` an ihren Eintraegen, AI Brain und
     * Manager nicht. Waere es hier die Vorgabe, haetten zwei Produkte beim
     * Umzug stillschweigend ein anderes Ladeverhalten bekommen.
     */
    it('holt die Zielseiten per Vorgabe NICHT vorab', () => {
        render(
            <SettingsShell items={EINTRAEGE}>
                <p>x</p>
            </SettingsShell>,
        );

        expect(
            screen.getAllByRole('link').every((a) => a.getAttribute('data-prefetch') === 'false'),
        ).toBe(true);
    });

    it('holt sie vorab, wenn das Produkt es verlangt', () => {
        render(
            <SettingsShell items={EINTRAEGE} prefetch>
                <p>x</p>
            </SettingsShell>,
        );

        expect(
            screen.getAllByRole('link').every((a) => a.getAttribute('data-prefetch') === 'true'),
        ).toBe(true);
    });

    /**
     * Die Enge der alten Layouts (`max-w-xl` in `md:max-w-2xl`) stammte aus
     * der Zeit mit Seitenspalte und schnitt breite Inhalte ab. Festgeschrieben,
     * damit sie beim naechsten Umbau nicht zurueckkehrt.
     */
    it('gibt dem Inhalt die volle Breite', () => {
        render(
            <SettingsShell items={EINTRAEGE}>
                <p>Inhalt</p>
            </SettingsShell>,
        );

        const rahmen = screen.getByText('Inhalt').parentElement;

        expect(rahmen?.className).not.toMatch(/\bmax-w-/);
        // `min-w-0`, sonst weigert sich ein Flex-/Grid-Kind zu schrumpfen und
        // schiebt den Inhalt aus dem Rahmen — dasselbe Abschneiden.
        expect(rahmen?.className).toContain('min-w-0');
    });

    it('laesst ein Produkt die Breite doch begrenzen', () => {
        render(
            <SettingsShell items={EINTRAEGE} contentClassName="max-w-xl">
                <p>Inhalt</p>
            </SettingsShell>,
        );

        expect(screen.getByText('Inhalt').parentElement?.className).toContain('max-w-xl');
    });

    /**
     * Ein Produkt, das alle Eintraege wegfiltert (keine Berechtigung), darf
     * keine leere Leiste mit Trennlinie hinterlassen.
     */
    it('laesst die Leiste ganz weg, wenn es keine Eintraege gibt', () => {
        render(
            <SettingsShell items={[]}>
                <p>Nur Inhalt</p>
            </SettingsShell>,
        );

        expect(screen.queryByRole('navigation')).toBeNull();
        expect(screen.getByText('Nur Inhalt')).toBeTruthy();
    });
});
