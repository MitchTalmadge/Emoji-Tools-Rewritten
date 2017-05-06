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

import {AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {ProjectService} from "../../core/services/project.service";
import {ETProject} from "../../models/project.model";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ProjectEmojiPaneComponent} from "./emoji-pane/emoji-pane.component";
import {UIKit} from "../../util/uikit";

@Component({
    selector: 'et-project',
    templateUrl: 'project.component.html',
    styleUrls: ['project.component.css']
})
export class ProjectComponent implements OnInit, AfterViewInit {

    /**
     * The current project being viewed.
     */
    project: ETProject;

    @ViewChild(ProjectEmojiPaneComponent) emojiPane: ProjectEmojiPaneComponent;

    /**
     * Determines if we are currently renaming the project or not.
     */
    renaming: boolean;

    /**
     * The form group for renaming the project.
     */
    renameFormGroup: FormGroup;

    /**
     * The input for renaming the project.
     */
    @ViewChildren('renamingInput') renamingInput: QueryList<ElementRef>;

    constructor(private router: Router,
                private activatedRoute: ActivatedRoute,
                private projectService: ProjectService,
                private formBuilder: FormBuilder) {
    }

    ngOnInit() {
        // Get the project from the route url
        this.activatedRoute.params.subscribe(params => {
            this.projectService.getProjectByName(params['name'])
                .subscribe(project => this.project = project);
        });
    }

    ngAfterViewInit() {
        // Automatically puts focus on the renaming input whenever it comes into view.
        this.renamingInput.changes.subscribe(
            changes => {
                if (this.renamingInput.first != null)
                    this.renamingInput.first.nativeElement.focus();
            }
        )
    }

    /**
     * When the Rename Project button is clicked.
     */
    onRenameProject() {
        if (this.emojiPane.isExtracting()) {
            UIKit.showWarningNotification("Please wait until extraction is complete.");
            return;
        }

        this.renameFormGroup = this.formBuilder.group({
            name: [this.project.name, Validators.compose([Validators.required, Validators.maxLength(30), Validators.pattern("^[A-Za-z0-9 ]+$")])]
        });
        this.renaming = true;
    }

    /**
     * When the Save Changes button is clicked during renaming.
     */
    onSaveRename() {
        this.projectService
            .renameProject(this.project.name, this.renameFormGroup.controls['name'].value)
            .subscribe(project => {
                this.router.navigate(['', 'project', project.name]);
                this.renaming = false;
            });
    }

    /**
     * When the Cancel button is clicked during renaming.
     */
    onCancelRename() {
        this.renaming = false;
    }

    /**
     * When the Exit Project button is clicked.
     */
    onExitProject() {
        if (this.emojiPane.isExtracting()) {
            UIKit.showWarningNotification("Please wait until extraction is complete.");
            return;
        }

        this.router.navigate(['']);
    }

    /**
     * When the status of extraction changes.
     * @param extracting If extraction is currently taking place.
     */
    onExtractingStatusChange(extracting: boolean) {
        // Cancel renaming during extraction.
        if (extracting) {
            this.renaming = false;
        }
    }
}