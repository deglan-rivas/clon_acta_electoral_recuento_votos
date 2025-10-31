// Organizations selection table component

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { X } from "lucide-react";
import { type PoliticalOrganization } from "../../types";
import { isSpecialOrganization } from "../../utils/organizationUtils";
import { SETTINGS_THEME } from "../../config/settingsTheme";

interface OrganizationsTableProps {
  organizations: PoliticalOrganization[];
  selectedKeys: string[];
  allToggleableSelected: boolean;
  searchValue: string;
  isPartialRecountMode?: boolean;
  onToggle: (orgKey: string) => void;
  onSelectAll: () => void;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
}

export function OrganizationsTable({
  organizations,
  selectedKeys,
  allToggleableSelected,
  searchValue,
  isPartialRecountMode = false,
  onToggle,
  onSelectAll,
  onSearchChange,
  onClearSearch,
}: OrganizationsTableProps) {
  return (
    <div className="space-y-3">
      {/* Table Header */}
      <Table>
        <TableHeader>
          <TableRow className="text-white" style={{ backgroundColor: SETTINGS_THEME.headerColor }}>
            {isPartialRecountMode && (
              <TableHead className="text-white w-16 text-center font-semibold">
                <Checkbox
                  checked={allToggleableSelected}
                  onCheckedChange={onSelectAll}
                  className="border-white data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
                />
              </TableHead>
            )}
            <TableHead className="text-white w-20 text-center font-semibold">ORDEN</TableHead>
            <TableHead className="text-white font-semibold">ORGANIZACIÓN POLÍTICA</TableHead>
          </TableRow>
          <TableRow className="bg-gray-50">
            {isPartialRecountMode && <TableHead className="p-2"></TableHead>}
            <TableHead className="p-2"></TableHead>
            <TableHead className="p-2">
              <div className="flex items-center space-x-1">
                <Input
                  placeholder="Filtrar..."
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="h-8 text-sm border-gray-300 flex-1"
                />
                {searchValue && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearSearch}
                    className="h-8 w-8 p-0 hover:bg-gray-200"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </Button>
                )}
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
      </Table>

      {/* Table Body */}
      <div className="max-h-60 overflow-y-auto">
        <Table>
          <TableBody>
            {organizations.map((org, index) => {
              // const isSpecial = isSpecialOrganization(org);
              // const isBlancoNulo = org.name === 'BLANCO' || org.name === 'NULO';
              const isBlancoNulo = isSpecialOrganization(org);
              const isSelected = selectedKeys.includes(org.key);
              const showCheckbox = isPartialRecountMode && !isBlancoNulo;

              return (
                <TableRow key={org.key} className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  {isPartialRecountMode && (
                    <TableCell className="text-center w-16">
                      {showCheckbox ? (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggle(org.key)}
                        />
                      ) : null}
                    </TableCell>
                  )}
                  <TableCell className="text-center font-medium w-20">{org.order}</TableCell>
                  <TableCell className="py-3">{org.name}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
