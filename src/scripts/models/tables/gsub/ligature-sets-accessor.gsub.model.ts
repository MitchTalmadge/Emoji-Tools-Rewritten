/*
 * Emoji Tools
 * Copyright (C) 2015-2017 Mitch Talmadge (https://MitchTalmadge.com)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {ETGSUBLigatureSet} from "./ligature-set.gsub.model";
import {ETGSUBLigatureSetsMap} from "./ligature-sets-map.gsub.model";
import {ETGSUBLigaturesMap} from "./ligatures-map.gsub.model";

/**
 * Provides an entry point for accessing either Ligature Sets or Ligatures by glyph names, through maps;
 * as well as the arrays themselves.
 */
export interface ETGSUBLigatureSetsAccessor {

    /**
     * All the Ligature Sets in order of appearance in the table.
     */
    ligatureSets?: ETGSUBLigatureSet[];

    /**
     * A map for accessing Ligature Sets via Ligature Set glyph names.
     */
    ligatureSetsMap?: ETGSUBLigatureSetsMap;

    /**
     * A map for accessing Ligatures via Ligature glyph names.
     */
    ligaturesMap?: ETGSUBLigaturesMap;

}