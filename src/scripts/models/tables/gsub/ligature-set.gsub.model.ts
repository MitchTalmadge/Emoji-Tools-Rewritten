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

import {ETGSUBLigature} from "./ligature.gsub.model";

/**
 * Represents a single Ligature Set in the GSUB Table.
 */
export interface ETGSUBLigatureSet {

    /**
     * The name of this set's glyph..
     */
    glyphName?: string;

    /**
     * The ligatures of this set in order of appearance in the Set.
     */
    ligatures?: ETGSUBLigature[];

}