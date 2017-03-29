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

import {ErrorHandler, NgModule, Optional, SkipSelf} from "@angular/core";
import {RESTService} from "./services/rest.service";
import {AppComponent} from "./app/app.component";
import {EmojiToolsErrorHandler} from "./error-handler";
import {TitleBarComponent} from "./title-bar/title-bar.component";

@NgModule({
    imports: [],
    declarations: [
        AppComponent,
        TitleBarComponent
    ],
    exports: [
        AppComponent,
        TitleBarComponent
    ],
    providers: [
        {
            provide: ErrorHandler,
            useClass: EmojiToolsErrorHandler
        },
        RESTService
    ],
})
export class CoreModule {

    constructor(@Optional() @SkipSelf() otherCoreModule: CoreModule) {
        if (otherCoreModule) {
            throw new Error("The Core Module was imported twice. It can only be imported once (in the root module)");
        }
    }

}
