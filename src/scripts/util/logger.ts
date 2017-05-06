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
import {deleteLog, log, setup} from "electron-log-rotate";

export class Logger {

    public static setup(): void {
        setup({
            appName: 'Emoji Tools/logs',
            maxSize: 10 * 1024 * 1024
        });
        deleteLog(10);
    }

    /**
     * Logs an info message to the console and log file.
     * @param message The message to log.
     */
    public static logInfo(message: string) {
        log("[INFO] " + message);
        console.log(message);
    }

    /**
     * Logs an error message to the console and log file.
     * @param message The message to log.
     */
    public static logError(message: string) {
        log("[ERROR] " + message);
        console.error(message);
    }

}