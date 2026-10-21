import { describe, expect, it } from 'vitest';
import { istAktiv, pfadVon } from '../src/aktiv';

describe('pfadVon', () => {
    it('nimmt eine Zeichenkette wie eine Wayfinder-Angabe', () => {
        expect(pfadVon('/settings/profile')).toBe('/settings/profile');
        expect(pfadVon({ url: '/settings/profile', method: 'get' })).toBe('/settings/profile');
    });

    it('schneidet die Abfragezeichenkette und die Sprungmarke ab', () => {
        expect(pfadVon('/settings/profile?tab=sicherheit')).toBe('/settings/profile');
        expect(pfadVon('/settings/profile#oben')).toBe('/settings/profile');
        expect(pfadVon('/settings/profile?a=1#oben')).toBe('/settings/profile');
    });

    it('wirft den Rumpf einer vollstaendigen Adresse weg', () => {
        expect(pfadVon('https://brain.proxy/settings/profile')).toBe('/settings/profile');
    });

    it('behandelt den abschliessenden Schraegstrich als denselben Ort', () => {
        expect(pfadVon('/settings/')).toBe('/settings');
        expect(pfadVon('/settings')).toBe('/settings');
    });

    it('laesst die Wurzel eine Wurzel sein und nicht die leere Zeichenkette', () => {
        expect(pfadVon('/')).toBe('/');
        expect(pfadVon('')).toBe('/');
        expect(pfadVon('https://brain.proxy')).toBe('/');
    });
});

describe('istAktiv', () => {
    it('trifft genau', () => {
        expect(istAktiv('/settings/profile', '/settings/profile')).toBe(true);
        expect(istAktiv('/settings/profile', '/settings/password')).toBe(false);
    });

    /**
     * Der eigentliche Grund fuer dieses Paket: Vorher hob eine Seite mit
     * Abfragezeichenkette keinen Eintrag mehr hervor.
     */
    it('bleibt aktiv, wenn die Seite eine Abfragezeichenkette traegt', () => {
        expect(istAktiv('/settings/profile', '/settings/profile?tab=sicherheit')).toBe(true);
    });

    it('nimmt ohne matchPrefix keine Unterseite mit', () => {
        expect(istAktiv('/settings/email-accounts', '/settings/email-accounts/7/bearbeiten')).toBe(false);
    });

    it('nimmt mit matchPrefix die Unterseite mit', () => {
        expect(istAktiv('/settings/email-accounts', '/settings/email-accounts/7/bearbeiten', true)).toBe(true);
    });

    it('greift nur auf Segmentgrenze — /settings/mail beansprucht nicht /settings/mailbox', () => {
        expect(istAktiv('/settings/mail', '/settings/mailbox', true)).toBe(false);
    });

    it('macht aus der Wurzel keinen Treffer fuer alles', () => {
        expect(istAktiv('/', '/settings/profile', true)).toBe(false);
    });
});
