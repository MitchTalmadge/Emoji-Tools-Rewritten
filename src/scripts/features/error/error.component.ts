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
import {ErrorService} from "../../core/services/error.service";
import {ETConstants} from "../../util/constants";
import {Electron} from "../../util/electron";
import {Router} from "@angular/router";

@Component({
    selector: 'et-error',
    templateUrl: 'error.component.html'
})
export class ErrorComponent implements OnInit {

    /**
     * The error that triggered this page.
     */
    error: string;

    constructor(private errorService: ErrorService,
                private router: Router) {
    }

    ngOnInit() {
        // Get the error, if available.
        this.errorService.getError().take(1).subscribe(error => this.error = error);
    }

    onClickSubmitIssue() {
        Electron.openExternalLink(ETConstants.ET_ISSUES_URL);
    }

    onClickGoHome() {
        this.router.navigate(['']);
    }
}