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

import {Component, OnInit} from "@angular/core";
import {animate, state, style, transition, trigger} from "@angular/animations";

@Component({
    selector: 'et-alert',
    templateUrl: 'alert.component.html',
    animations: [
        trigger('alertDisplayed', [
            state('1', style({opacity: 1, height: '*'})),
            state('0', style({opacity: 0, margin: 0, padding: '0 15px', height: 0})),
            transition('1 => 0', animate('200ms')),
            transition('0 => 1', animate('200ms'))
        ])
    ]
})
export class AlertComponent implements OnInit {

    /**
     * The message to be displayed.
     */
    message: string;

    /**
     * Whether or not the message is displayed.
     */
    displayed: boolean = false;

    /**
     * The style of the message. (danger, primary, etc).
     */
    style: string;

    constructor() {
    }

    ngOnInit() {
    }

    /**
     * Displays an info message using the primary styling.
     * @param message The message to display.
     */
    displayInfoMessage(message: string) {
        this.message = message;
        this.style = 'primary';
        this.displayed = true;
    }

    /**
     * Displays a success message using the success styling.
     * @param message The message to display.
     */
    displaySuccessMessage(message: string) {
        this.message = message;
        this.style = 'success';
        this.displayed = true;
    }

    /**
     * Displays a warning message using the warning styling.
     * @param message The message to display.
     */
    displayWarningMessage(message: string) {
        this.message = message;
        this.style = 'warning';
        this.displayed = true;
    }

    /**
     * Displays an error message using the danger styling.
     * @param message The message to display.
     */
    displayErrorMessage(message: string) {
        this.message = message;
        this.style = 'danger';
        this.displayed = true;
    }

    /**
     * When the close button is clicked.
     */
    onClose() {
        this.displayed = false;
    }

}