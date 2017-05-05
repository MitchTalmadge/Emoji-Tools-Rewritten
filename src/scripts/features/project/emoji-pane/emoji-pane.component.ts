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
import {EmojiService} from "../../../core/services/emoji.service";
import {AlertComponent} from "../../../shared/alert/alert.component";

@Component({
    selector: 'et-project-emoji-pane',
    templateUrl: 'emoji-pane.component.html',
    styleUrls: ['emoji-pane.component.css']
})
export class ProjectEmojiPaneComponent implements OnInit {

    /**
     * The project associated with this pane.
     */
    @Input() project: ETProject;

    @ViewChild(AlertComponent) alert: AlertComponent;

    /**
     * Whether or not we are currently extracting Emojis.
     */
    extracting: boolean = false;

    /**
     * The progress of extraction, from 0 to 100.
     */
    extractionProgress: number = 0;

    constructor(private emojiService: EmojiService) {
    }

    ngOnInit() {
    }

    /**
     * When the Extract Emojis button is clicked.
     */
    onExtractEmojis() {
        if (this.project != null && this.project.extractionPath == null) {
            this.extracting = true;
            this.emojiService.extractEmojis(this.project)
                .subscribe(
                    progress => {
                        this.extractionProgress = progress;
                    },
                    err => {
                        console.error(err);
                        this.alert.displayErrorMessage("Could not Extract Emojis: " + err);
                        this.extracting = false;
                    },
                    () => {
                        this.extracting = false;
                        this.alert.displaySuccessMessage("Emojis Extracted Successfully!");
                    }
                );
        }
    }

}