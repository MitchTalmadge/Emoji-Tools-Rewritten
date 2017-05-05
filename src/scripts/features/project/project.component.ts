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

import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {ProjectService} from "../../core/services/project.service";
import {ETProject} from "../../models/project.model";

@Component({
    selector: 'et-project',
    templateUrl: 'project.component.html'
})
export class ProjectComponent implements OnInit {

    project: ETProject;

    constructor(private activatedRoute: ActivatedRoute,
                private projectService: ProjectService) {
    }

    ngOnInit() {
        this.activatedRoute.params.subscribe(params => {
            this.projectService.getProjectById(params['projectId'])
                .subscribe(project => this.project = project);

        })

    }
}