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

import {Injectable} from '@angular/core';
import {ETProject} from "../../models/project.model";
import * as path from "path";
import * as fs from "fs-extra";
import {ETConstants} from "../../util/constants";

/**
 * This service provides convenience methods for working with and determining paths
 * to common files and directories within the project data path.
 */
@Injectable()
export class ProjectPathService {

    /**
     * Returns the path to the directory that emojis are extracted to for the given project.
     * @param {ETProject} project The project to get paths of.
     * @returns {string} The path to the extraction directory of the project.
     */
    public static extractionDirectoryPath(project: ETProject): string {
        return path.join(project.dataPath, ETConstants.PROJECT_EMOJI_EXTRACTION_DIR_NAME)
    }

    /**
     * Determines if the extraction directory for the given project exists.
     * @param {ETProject} project The project to check.
     * @returns {boolean} True if the extraction directory exists.
     */
    public static extractionDirectoryExists(project: ETProject): boolean {
        return fs.pathExistsSync(ProjectPathService.extractionDirectoryPath(project));
    }

    /**
     * Returns the path to the directory that the ttx files are extracted to for the given project.
     * @param {ETProject} project The project to get paths of.
     * @returns {string} The path to the ttx directory of the project.
     */
    public static ttxDirectoryPath(project: ETProject): string {
        return path.join(project.dataPath, ETConstants.PROJECT_TTX_DIR_NAME)
    }

    /**
     * Determines if the ttx directory for the given project exists.
     * @param {ETProject} project The project to check.
     * @returns {boolean} True if the ttx directory exists.
     */
    public static ttxDirectoryExists(project: ETProject): boolean {
        return fs.pathExistsSync(ProjectPathService.ttxDirectoryPath(project));
    }

}