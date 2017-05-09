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

import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {ETProject} from "../../../models/project.model";
import {ProjectService} from "../../../core/services/project.service";
import {Router} from "@angular/router";
import {UIKit} from "../../../util/uikit";
import {ConfirmationModalComponent} from "../../../shared/confirmation-modal/confirmation-modal.component";

@Component({
    selector: 'et-project-tools-sidebar',
    templateUrl: 'tools-sidebar.component.html'
})
export class ProjectToolsSidebarComponent implements OnInit {

    /**
     * The sidebar's associated project.
     */
    @Input() project: ETProject;

    /**
     * The modal for confirming deletion of the project.
     */
    @ViewChild('projectDeletionModal') projectDeletionModal: ConfirmationModalComponent;

    constructor(private projectService: ProjectService,
                private router: Router) {
    }

    ngOnInit() {
    }

    /**
     * When the Export Emojis link is clicked.
     */
    onExportEmojis() {
    }

    /**
     * When the Delete Project link is clicked.
     */
    onClickDeleteProject() {
        // Open the confirmation modal.
        this.projectDeletionModal.openModal();
    }

    /**
     * Deletes the Project. (Called after confirmation)
     */
    deleteProject() {
        this.projectService.deleteProject(this.project)
            .then(
                () => {
                    this.router.navigate(['']);
                    UIKit.showSuccessNotification("The Project '" + this.project.name + "' has been deleted.");
                }
            )
    }

}