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

import {Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import {ModalComponent} from "../modal/modal.component";

/**
 * A Confirmation modal with pre-added buttons and logic.
 * The modal body is defined by the ng-content.
 */
@Component({
    selector: 'et-confirmation-modal',
    templateUrl: 'confirmation-modal.component.html'
})
export class ConfirmationModalComponent {

    /**
     * The title of the modal. Null to omit.
     * Default: "Confirmation"
     */
    @Input() title: string = "Confirmation";

    /**
     * The confirmation button style (primary, success, warning, danger)
     * Default: "primary"
     */
    @Input() confirmButtonStyle: string = "primary";

    /**
     * The confirmation button text
     * Default: "Yes"
     */
    @Input() confirmButtonText: string = "Confirm";

    /**
     * The cancel button text.
     * Default: "Cancel"
     */
    @Input() cancelButtonText: string = "Cancel";

    /**
     * Emitted when the user confirms.
     */
    @Output() confirmed = new EventEmitter<void>();

    /**
     * Emitted when the user cancels.
     */
    @Output() cancelled = new EventEmitter<void>();

    /**
     * The modal.
     */
    @ViewChild(ModalComponent) modal: ModalComponent;

    /**
     * Opens the modal.
     */
    public openModal() {
        this.modal.openModal();
    }

    /**
     * Closes the modal.
     */
    public closeModal() {
        this.modal.closeModal();
    }

    /**
     * When the confirm button is clicked.
     */
    onClickConfirm() {
        this.modal.closeModal();
        this.confirmed.emit();
    }

    /**
     * When the cancel button is clicked.
     */
    onClickCancel() {
        this.modal.closeModal();
        this.cancelled.emit();
    }
}