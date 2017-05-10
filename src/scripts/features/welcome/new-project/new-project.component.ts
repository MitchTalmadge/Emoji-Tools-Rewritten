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
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ProjectService} from "../../../core/services/project.service";
import {Router} from "@angular/router";
import {ETFontType} from "../../../models/font-type.enum";
import {Electron} from "../../../util/electron";
import {Logger} from "../../../util/logger";
import {ETConstants} from "../../../util/constants";
import {FontToolsService} from "../../../core/services/font-tools.service";
const UIkit = require("uikit");

@Component({
    selector: 'et-new-project',
    templateUrl: 'new-project.component.html',
    styleUrls: ['new-project.component.css']
})
export class NewProjectComponent implements OnInit {

    FONT_TYPE_ANDROID = ETFontType.ANDROID;
    FONT_TYPE_APPLE = ETFontType.APPLE;

    /**
     * The current step in the creation process.
     */
    step: number = 0;

    /**
     * Contains data about the new project.
     */
    formGroup: FormGroup;

    constructor(private formBuilder: FormBuilder,
                private projectService: ProjectService,
                private fontToolsService: FontToolsService,
                private router: Router) {
    }

    ngOnInit() {
        this.reset();
    }

    /**
     * When a font file is selected on step 0.
     * @param event The change event.
     */
    onFontFileSelected(event) {
        // Get the files from the event
        let files: FileList = event.srcElement.files;

        // Update the formGroup control.
        this.formGroup.controls['fontFile'].setValue(files.item(0));
    }

    /**
     * When the Continue button is clicked. Increases the current step by 1.
     */
    onClickContinue() {
        // After step 0, detect font type.
        if (this.step == 0) {
            this.fontToolsService.determineFontType(this.formGroup.controls['fontFile'].value['path'])
                .then(fontType => {
                    this.formGroup.controls['fontType'].setValue(fontType);
                    this.step = 1;
                })
                .catch(err => {
                    Logger.logError("Could not determine type of font file for new project: " + err, this);
                    this.formGroup.controls['fontType'].setValue(null);
                    this.step = 1;
                });
        } else {
            this.step++;
        }
    }

    /**
     * When the Go Back button is clicked. Decreases the current step by 1.
     */
    onClickGoBack() {
        this.step--;
    }

    /**
     * Resets the fields pertaining to the new project.
     */
    private reset() {
        this.step = 0;
        this.formGroup = this.formBuilder.group({
            fontFile: [null],
            fontType: [null],
            name: [null, Validators.compose([Validators.required, Validators.maxLength(30), Validators.pattern("^[A-Za-z0-9 ]+$")])]
        })
    }

    /**
     * When the Finish button is clicked on the last step.
     */
    onClickFinish() {
        this.projectService.saveNewProject(
            this.formGroup.controls['name'].value,
            this.formGroup.controls['fontFile'].value['path'],
            this.formGroup.controls['fontType'].value)
            .subscribe(project => this.router.navigate(['project', project.name]));
    }

    /**
     * When the Start Over button is clicked.
     */
    onClickStartOver() {
        this.reset();
    }

    /**
     * When a font is not supported and the user clicks the help link.
     */
    onOpenUnsupportedFontHelpPage() {
        Electron.openExternalLink(ETConstants.ET_ISSUES_URL);
    }

}