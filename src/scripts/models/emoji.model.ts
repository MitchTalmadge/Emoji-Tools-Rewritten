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

import {SafeUrl} from "@angular/platform-browser";
/**
 * Info for a single extracted Emoji.
 */
export interface ETEmoji {

    /**
     * The path to the extracted emoji file.
     */
    imagePath?: string;

    /**
     * A path to the extracted emoji that is safe for Angular to use in an img src.
     */
    imgSrcPath?: SafeUrl;

    /**
     * The unicodes that make up the Emoji.
     */
    codes?: string[];

}