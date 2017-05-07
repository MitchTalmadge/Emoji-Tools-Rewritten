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

import {ETFontType} from "./font-type.enum";

/**
 * Represents an Emoji Tools project.
 */
export interface ETProject {

    /**
     * The name of the project, used for data directory name, display, etc.
     */
    name?: string

    /**
     * The path to the project's data directory.
     */
    dataPath?: string

    /**
     * The path to the project's original font file, which is within its data directory.
     */
    fontPath?: string

    /**
     * The type of the font.
     */
    fontType?: ETFontType

    /**
     * The path to the project's ttx directory, containing the individual ttx table files.
     */
    ttxDirPath?: string

    /**
     * The path to the extracted Emojis directory within the project's data directory.
     * May be null if the Emojis have not been extracted.
     */
    extractionPath?: string

    /**
     * The last time this project was modified.
     * Can be formatted as a moment.
     */
    lastModified?: string

}