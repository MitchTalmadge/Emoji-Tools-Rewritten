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

import { Component, OnInit } from '@angular/core';
import {ETPlatform, ETProject} from "../../../models/project.model";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
    selector: 'et-new-project',
    templateUrl: 'new-project.component.html',
    styleUrls: ['new-project.component.css']
})
export class NewProjectComponent implements OnInit {

    ANDROID = ETPlatform.ANDROID;
    APPLE = ETPlatform.APPLE;

    /**
     * The project being created.
     */
    newProject: ETProject;

    formGroup: FormGroup;

    constructor(private formBuilder: FormBuilder) { }

    ngOnInit() {
        this.reset();
    }

    /**
     * Resets the fields pertaining to the new project.
     */
    private reset() {
        this.newProject = {};
        this.formGroup = this.formBuilder.group({
            name: [null, Validators.compose([Validators.required, Validators.maxLength(30), Validators.pattern("^[A-Za-z0-9 ]+$")])]
        })
    }

    onClickPlatform(platform: ETPlatform) {
        this.newProject.platform = platform;
    }

    onClickFinish() {
        this.newProject.name = this.formGroup.controls['name'].value;
        // TODO: Save project
    }

    onClickStartOver() {
        this.reset();
    }

}