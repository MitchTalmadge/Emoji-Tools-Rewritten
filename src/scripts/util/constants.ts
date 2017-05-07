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

import * as path from "path";
import {Electron} from "./electron";
export class ETConstants {

    // Projects data directory

    public static readonly PROJECT_DATA_DIR_NAME = "projects";
    public static readonly PROJECT_DATA_DIR_PATH = path.join(Electron.getUserDataPath(), ETConstants.PROJECT_DATA_DIR_NAME);

    // Projects save file

    public static readonly PROJECTS_SAVE_FILE_NAME = "projects.json";
    public static readonly PROJECTS_SAVE_FILE_PATH = path.join(Electron.getUserDataPath(), ETConstants.PROJECTS_SAVE_FILE_NAME);

    /**
     * Names that are reserved for Windows.
     * These names will not work and are not allowed as project names.
     */
    public static readonly PROJECT_RESERVED_NAMES = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];

    // Project specific constants

    public static readonly PROJECT_FONT_NAME = "font.ttf";

    public static readonly PROJECT_TTX_FILE_NAME = "font.ttx";
    public static readonly PROJECT_TTX_DIR_NAME = "ttx";

    public static readonly PROJECT_EMOJI_EXTRACTION_DIR_NAME = "extracted_emojis";

}