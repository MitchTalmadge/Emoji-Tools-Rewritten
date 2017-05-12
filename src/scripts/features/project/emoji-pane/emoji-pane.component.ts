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

import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from "@angular/core";
import {ETProject} from "../../../models/project.model";
import {EmojiService} from "../../../core/services/emoji.service";
import {AlertComponent} from "../../../shared/alert/alert.component";
import {Subscription} from "rxjs/Subscription";
import {ETEmoji} from "../../../models/emoji.model";
import {Logger} from "../../../util/logger";

@Component({
    selector: 'et-project-emoji-pane',
    templateUrl: 'emoji-pane.component.html',
    styleUrls: ['emoji-pane.component.css']
})
export class ProjectEmojiPaneComponent implements OnInit, OnDestroy {

    /**
     * The project associated with this pane.
     */
    @Input() project: ETProject;

    /**
     * An alert at the top of the component used for various messages.
     */
    @ViewChild(AlertComponent) alert: AlertComponent;

    /**
     * Emits the status of extraction.
     * True if extracting is started, false if it is ended.
     */
    @Output() extracting = new EventEmitter<boolean>();

    /**
     * The subscription to the extraction process.
     * Null or not active if extraction is not taking place.
     */
    extractionSubscription: Subscription;

    /**
     * The progress of extraction, from 0 to 100.
     */
    extractionProgress: number = 0;

    /**
     * The extracted emojis.
     */
    emojis: ETEmoji[] = [];

    constructor(private emojiService: EmojiService) {
    }

    ngOnInit() {
        this.loadEmojis();
    }

    ngOnDestroy() {
        // Stop extraction.
        if (this.isExtracting()) {
            this.extractionSubscription.unsubscribe();
        }
    }

    /**
     * Loads the array of Emojis into the emojis field if they have been extracted.
     */
    loadEmojis() {
        if (this.project != null && this.project.extractionPath != null) {
            this.emojiService.getExtractedEmojis(this.project).then(
                emojis => this.emojis = emojis,
                err => {
                    Logger.logError("Couldn't load Emojis: " + err, this);
                }
            )
        }
    }

    /**
     * When the Extract Emojis button is clicked.
     */
    onExtractEmojis() {
        if (this.project != null && this.project.extractionPath == null) {
            this.extracting.emit(true);
            this.extractionSubscription = this.emojiService.extractEmojis(this.project)
                .subscribe(
                    progress => {
                        this.extractionProgress = progress;
                    },
                    err => {
                        console.error(err);
                        this.alert.displayErrorMessage("Could not Extract Emojis: " + err);
                    },
                    () => {
                        this.alert.displaySuccessMessage("Emojis Extracted Successfully!");
                        this.loadEmojis();
                    }
                );
        }
    }

    /**
     * Determines if extraction is currently taking place.
     * @returns True if extracting, false if not.
     */
    isExtracting() {
        return this.extractionSubscription != null && !this.extractionSubscription.closed;
    }

}