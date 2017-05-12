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
import {EmojiToolsErrorHandler} from "./error-handler";
import {ProjectService} from "./services/project.service";
import {SharedModule} from "../shared/shared.module";
import {EmojiService} from "./services/emoji.service";
import {FontToolsService} from "./services/font-tools.service";
import {TablesServiceModule} from "./services/tables/tables.module";
import {ErrorService} from "./services/error.service";
import {CgBIService} from "./services/cgbi.service";

@NgModule({
    imports: [
        SharedModule,

        TablesServiceModule
    ],
    declarations: [],
    exports: [],
    providers: [
        {
            provide: ErrorHandler,
            useClass: EmojiToolsErrorHandler
        },
        CgBIService,
        EmojiService,
        ErrorService,
        FontToolsService,
        ProjectService,
        RESTService,
    ],
})
export class CoreModule {

    constructor(@Optional() @SkipSelf() otherCoreModule: CoreModule) {
        if (otherCoreModule) {
            throw new Error("The Core Module was imported twice. It can only be imported once (in the root module)");
        }
    }

}
