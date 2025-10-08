// Utility functions for political organization operations

import { type PoliticalOrganization } from "../types";

/**
 * Special organization names that are always required
 */
export const SPECIAL_ORGANIZATIONS = {
  BLANCO: 'BLANCO',
  NULO: 'NULO',
} as const;

/**
 * Extracts keys for BLANCO and NULO organizations
 */
export function getBlancoNuloKeys(organizations: PoliticalOrganization[]): string[] {
  return organizations
    .filter(org => org.name === SPECIAL_ORGANIZATIONS.BLANCO || org.name === SPECIAL_ORGANIZATIONS.NULO)
    .map(org => org.key);
}

/**
 * Checks if an organization is BLANCO or NULO
 */
export function isSpecialOrganization(org: PoliticalOrganization): boolean {
  return org.name === SPECIAL_ORGANIZATIONS.BLANCO || org.name === SPECIAL_ORGANIZATIONS.NULO;
}

/**
 * Filters organizations by search term (name or order number)
 */
export function filterOrganizations(
  organizations: PoliticalOrganization[],
  searchTerm: string
): PoliticalOrganization[] {
  const lowerSearch = searchTerm.toLowerCase();
  return organizations.filter(org =>
    org.name.toLowerCase().includes(lowerSearch) ||
    (org.order && org.order.toString().includes(searchTerm))
  );
}

/**
 * Gets all toggleable organizations (excludes BLANCO and NULO)
 */
export function getToggleableOrganizations(
  organizations: PoliticalOrganization[]
): PoliticalOrganization[] {
  return organizations.filter(org => !isSpecialOrganization(org));
}

/**
 * Checks if all toggleable organizations are selected
 */
export function areAllToggleableSelected(
  organizations: PoliticalOrganization[],
  selectedKeys: string[]
): boolean {
  const toggleable = getToggleableOrganizations(organizations);
  return toggleable.length > 0 && toggleable.every(org => selectedKeys.includes(org.key));
}

/**
 * Ensures BLANCO and NULO are always included in selection
 */
export function ensureBlancoNuloSelected(
  selectedKeys: string[],
  organizations: PoliticalOrganization[]
): string[] {
  const blancoNuloKeys = getBlancoNuloKeys(organizations);
  return [...new Set([...selectedKeys, ...blancoNuloKeys])];
}
