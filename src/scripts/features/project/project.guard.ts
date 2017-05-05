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

import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs/Observable";
import {ProjectService} from "../../core/services/project.service";

/**
 * Determines if the project route is valid. (Does the project name exist?)
 * Redirects to root if not.
 */
@Injectable()
export class ProjectGuard implements CanActivate {

    constructor(private projectService: ProjectService,
                private router: Router) {

    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return Observable.create(listener => {
            let projectId = route.params['name'];

            this.projectService.getProjectByName(projectId)
                .subscribe(
                    project => {
                        listener.next(true);
                    },
                    err => {
                        listener.next(false);
                        this.router.navigate(['']);
                    },
                    () => {
                        listener.complete();
                    }
                )
        });
    }

}