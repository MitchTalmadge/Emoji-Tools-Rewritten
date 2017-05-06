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

const UIkit = require("uikit");

/**
 * UIKit utility methods.
 */
export class UIKit {

    public static showDefaultNotification(message: string) {
        UIkit.notification(message);
    }

    public static showInfoNotification(message: string) {
        UIkit.notification(message, {status: 'primary'});
    }

    public static showSuccessNotification(message: string) {
        UIkit.notification(message, {status: 'success'});
    }

    public static showWarningNotification(message: string) {
        UIkit.notification(message, {status: 'warning'});
    }

    public static showDangerNotification(message: string) {
        UIkit.notification(message, {status: 'danger'});
    }

}