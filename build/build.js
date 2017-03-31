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

const packager = require('electron-packager');
const path = require('path');

packager({
    dir: path.join(__dirname, '/prod'),
    all: true,
    appCopyright: 'Copyright (C) 2015-2017 Mitch Talmadge (https://MitchTalmadge.com)',
    win32metadata: {
        CompanyName: 'Mitch Talmadge',
        FileDescription: 'Emoji Tools',
        OriginalFilename: 'Emoji Tools.exe',
        ProductName: 'Emoji Tools'
    },
    icon: path.join(__dirname, '../src/resources/images/favicon.ico'),
    out: path.join(__dirname, '/bin'),
    overwrite: true,
    prune: false
}, () => {

    // Build setup once packaging is complete
    require("innosetup-compiler")(path.join(__dirname, '/setup.iss'), {
        gui: false,
        verbose: true
    }, () => {
        // Packaging and Setup complete.
        console.log("Finished.");
    });
});