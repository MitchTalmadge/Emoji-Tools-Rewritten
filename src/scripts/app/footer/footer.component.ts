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
import {Electron} from "../../util/electron";
import {ETConstants} from "../../util/constants";

@Component({
    selector: 'et-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
    constructor() {
    }

    ngOnInit() {
    }

    /**
     * When the name in the copyright message is clicked.
     */
    onClickCopyrightName() {
        Electron.openExternalLink(ETConstants.MITCH_HOMEPAGE_URL);
    }

    /**
     * When the help link is clicked.
     */
    onClickGetHelp() {
        Electron.openExternalLink(ETConstants.ET_ISSUES_URL);
    }

    /**
     * When the donate link is clicked.
     */
    onClickDonate() {
        Electron.openExternalLink(ETConstants.MITCH_DONATE_URL);
    }

}