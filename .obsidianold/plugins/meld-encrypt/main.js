'use strict';

var obsidian = require('obsidian');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

class DecryptModal extends obsidian.Modal {
    constructor(app, title, text = '') {
        super(app);
        this.decryptInPlace = false;
        this.text = text;
        this.titleEl.innerText = title;
    }
    onOpen() {
        let { contentEl } = this;
        const textEl = contentEl.createDiv().createEl('textarea', { text: this.text });
        textEl.style.width = '100%';
        textEl.style.height = '100%';
        textEl.rows = 10;
        textEl.readOnly = true;
        //textEl.focus(); // Doesn't seem to work here...
        setImmediate(() => { textEl.focus(); }); //... but this does
        const btnContainerEl = contentEl.createDiv('');
        const decryptInPlaceBtnEl = btnContainerEl.createEl('button', { text: 'Decrypt in-place' });
        decryptInPlaceBtnEl.addEventListener('click', () => {
            this.decryptInPlace = true;
            this.close();
        });
        const cancelBtnEl = btnContainerEl.createEl('button', { text: 'Close' });
        cancelBtnEl.addEventListener('click', () => {
            this.close();
        });
    }
}

class PasswordModal extends obsidian.Modal {
    constructor(app, confirmPassword, defaultPassword = null) {
        super(app);
        this.password = null;
        this.defaultPassword = null;
        this.defaultPassword = defaultPassword;
        this.confirmPassword = confirmPassword;
    }
    onOpen() {
        var _a, _b;
        let { contentEl } = this;
        contentEl.empty();
        const pwInputEl = contentEl.createDiv()
            .createSpan({ text: '🔑 ' })
            .createEl('input', { type: 'password', value: (_a = this.defaultPassword) !== null && _a !== void 0 ? _a : '' });
        pwInputEl.placeholder = 'Enter your password';
        pwInputEl.style.width = '93%';
        pwInputEl.focus();
        const confirmPwContainerEl = contentEl.createDiv();
        const pwConfirmInputEl = confirmPwContainerEl
            .createSpan({ text: '🔑 ' })
            .createEl('input', { type: 'password', value: (_b = this.defaultPassword) !== null && _b !== void 0 ? _b : '' });
        pwConfirmInputEl.placeholder = 'Confirm your password';
        pwConfirmInputEl.style.width = '93%';
        pwConfirmInputEl.addEventListener('keypress', (ev) => {
            if (ev.code === 'Enter' && pwConfirmInputEl.value.length > 0) {
                ev.preventDefault();
                if (pwInputEl.value == pwConfirmInputEl.value) {
                    this.password = pwConfirmInputEl.value;
                    this.close();
                }
                else {
                    // passwords don't match
                    messageEl.setText('Passwords don\'t match');
                    messageEl.show();
                }
            }
        });
        confirmPwContainerEl.style.marginTop = '1em';
        if (!this.confirmPassword) {
            confirmPwContainerEl.hide();
        }
        const messageEl = contentEl.createDiv();
        messageEl.style.marginTop = '1em';
        messageEl.hide();
        pwInputEl.addEventListener('keypress', (ev) => {
            if (ev.code === 'Enter' && pwInputEl.value.length > 0) {
                ev.preventDefault();
                if (this.confirmPassword) {
                    // confim password
                    pwConfirmInputEl.focus();
                }
                else {
                    this.password = pwInputEl.value;
                    this.close();
                }
            }
        });
    }
}

const algorithm = {
    name: 'AES-GCM',
    iv: new Uint8Array([196, 190, 240, 190, 188, 78, 41, 132, 15, 220, 84, 211]),
    tagLength: 128
};
class CryptoHelper {
    buildKey(password) {
        return __awaiter(this, void 0, void 0, function* () {
            let utf8Encode = new TextEncoder();
            let passwordBytes = utf8Encode.encode(password);
            let passwordDigest = yield crypto.subtle.digest({ name: 'SHA-256' }, passwordBytes);
            let key = yield crypto.subtle.importKey('raw', passwordDigest, algorithm, false, ['encrypt', 'decrypt']);
            return key;
        });
    }
    encryptToBase64(text, password) {
        return __awaiter(this, void 0, void 0, function* () {
            let key = yield this.buildKey(password);
            let utf8Encode = new TextEncoder();
            let bytesToEncrypt = utf8Encode.encode(text);
            // encrypt into bytes
            let encryptedBytes = new Uint8Array(yield crypto.subtle.encrypt(algorithm, key, bytesToEncrypt));
            //convert array to base64
            let base64Text = btoa(String.fromCharCode(...encryptedBytes));
            return base64Text;
        });
    }
    stringToArray(str) {
        var result = [];
        for (var i = 0; i < str.length; i++) {
            result.push(str.charCodeAt(i));
        }
        return new Uint8Array(result);
    }
    decryptFromBase64(base64Encoded, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // convert base 64 to array
                let bytesToDecrypt = this.stringToArray(atob(base64Encoded));
                let key = yield this.buildKey(password);
                // decrypt into bytes
                let decryptedBytes = yield crypto.subtle.decrypt(algorithm, key, bytesToDecrypt);
                // convert bytes to text
                let utf8Decode = new TextDecoder();
                let decryptedText = utf8Decode.decode(decryptedBytes);
                return decryptedText;
            }
            catch (e) {
                return null;
            }
        });
    }
}

class MeldEncryptSettingsTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        let { containerEl } = this;
        containerEl.empty();
        new obsidian.Setting(containerEl)
            .setName('Confirm password?')
            .setDesc('Confirm password when encrypting.')
            .addToggle(toggle => {
            toggle
                .setValue(this.plugin.settings.confirmPassword)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.confirmPassword = value;
                yield this.plugin.saveSettings();
                this.updateSettingsUi();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName('Remember password?')
            .setDesc('Remember the last used password for this session.')
            .addToggle(toggle => {
            toggle
                .setValue(this.plugin.settings.rememberPassword)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.rememberPassword = value;
                yield this.plugin.saveSettings();
                this.updateSettingsUi();
            }));
        });
        this.pwTimeoutSetting = new obsidian.Setting(containerEl)
            .setName(this.buildPasswordTimeoutSettingName())
            .setDesc('The number of minutes to remember the last used password.')
            .addSlider(slider => {
            slider
                .setLimits(0, 120, 5)
                .setValue(this.plugin.settings.rememberPasswordTimeout)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.rememberPasswordTimeout = value;
                yield this.plugin.saveSettings();
                this.updateSettingsUi();
            }));
        });
        this.updateSettingsUi();
    }
    updateSettingsUi() {
        this.pwTimeoutSetting.setName(this.buildPasswordTimeoutSettingName());
        if (this.plugin.settings.rememberPassword) {
            this.pwTimeoutSetting.settingEl.show();
        }
        else {
            this.pwTimeoutSetting.settingEl.hide();
        }
    }
    buildPasswordTimeoutSettingName() {
        const value = this.plugin.settings.rememberPasswordTimeout;
        let timeoutString = `${value} minutes`;
        if (value == 0) {
            timeoutString = 'Never forget';
        }
        return `Remember Password Timeout (${timeoutString})`;
    }
}

const _PREFIX = '%%🔐 ';
const _SUFFIX = ' 🔐%%';
const DEFAULT_SETTINGS = {
    confirmPassword: true,
    rememberPassword: true,
    rememberPasswordTimeout: 30
};
class MeldEncrypt extends obsidian.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadSettings();
            this.addSettingTab(new MeldEncryptSettingsTab(this.app, this));
            this.addCommand({
                id: 'encrypt-decrypt',
                name: 'Encrypt/Decrypt',
                checkCallback: (checking) => this.processEncryptDecryptCommand(checking, false)
            });
            this.addCommand({
                id: 'encrypt-decrypt-in-place',
                name: 'Encrypt/Decrypt In-place',
                checkCallback: (checking) => this.processEncryptDecryptCommand(checking, true)
            });
        });
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
        });
    }
    processEncryptDecryptCommand(checking, decryptInPlace) {
        const mdview = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        if (!mdview) {
            return false;
        }
        const editor = mdview.sourceMode.cmEditor;
        if (!editor) {
            return false;
        }
        const startLine = editor.getCursor('from').line;
        const startPos = { line: startLine, ch: 0 }; // want the start of the first line
        const endLine = editor.getCursor('to').line;
        const endLineText = editor.getLine(endLine);
        const endPos = { line: endLine, ch: endLineText.length }; // want the end of last line
        const selectionText = editor.getRange(startPos, endPos);
        if (selectionText.length == 0) {
            return false;
        }
        const decrypt = selectionText.startsWith(_PREFIX) && selectionText.endsWith(_SUFFIX);
        const encrypt = !selectionText.contains(_PREFIX) && !selectionText.contains(_SUFFIX);
        if (!decrypt && !encrypt) {
            return false;
        }
        if (checking) {
            return true;
        }
        // Fetch password from user
        // determine default password
        const isRememberPasswordExpired = !this.settings.rememberPassword
            || (this.passwordLastUsedExpiry != null
                && Date.now() > this.passwordLastUsedExpiry);
        if (isRememberPasswordExpired) {
            this.passwordLastUsed = '';
        }
        const confirmPassword = encrypt && this.settings.confirmPassword;
        const pwModal = new PasswordModal(this.app, confirmPassword, this.passwordLastUsed);
        pwModal.onClose = () => {
            var _a;
            const pw = (_a = pwModal.password) !== null && _a !== void 0 ? _a : '';
            if (pw.length == 0) {
                return;
            }
            // remember password?
            if (this.settings.rememberPassword) {
                this.passwordLastUsed = pw;
                this.passwordLastUsedExpiry =
                    this.settings.rememberPasswordTimeout == 0
                        ? null
                        : Date.now() + this.settings.rememberPasswordTimeout * 1000 * 60 // new expiry
                ;
            }
            if (encrypt) {
                this.encryptSelection(editor, selectionText, pw, startPos, endPos);
            }
            else {
                this.decryptSelection(editor, selectionText, pw, startPos, endPos, decryptInPlace);
            }
        };
        pwModal.open();
        return true;
    }
    encryptSelection(editor, selectionText, password, finalSelectionStart, finalSelectionEnd) {
        return __awaiter(this, void 0, void 0, function* () {
            //encrypt
            const crypto = new CryptoHelper();
            const base64EncryptedText = this.addMarkers(yield crypto.encryptToBase64(selectionText, password));
            editor.setSelection(finalSelectionStart, finalSelectionEnd);
            editor.replaceSelection(base64EncryptedText, 'around');
        });
    }
    decryptSelection(editor, selectionText, password, selectionStart, selectionEnd, decryptInPlace) {
        return __awaiter(this, void 0, void 0, function* () {
            // decrypt
            const base64CipherText = this.removeMarkers(selectionText);
            const crypto = new CryptoHelper();
            const decryptedText = yield crypto.decryptFromBase64(base64CipherText, password);
            if (decryptedText === null) {
                new obsidian.Notice('❌ Decryption failed!');
            }
            else {
                if (decryptInPlace) {
                    editor.setSelection(selectionStart, selectionEnd);
                    editor.replaceSelection(decryptedText, 'around');
                }
                else {
                    const decryptModal = new DecryptModal(this.app, '🔓', decryptedText);
                    decryptModal.onClose = () => {
                        editor.focus();
                        if (decryptModal.decryptInPlace) {
                            editor.setSelection(selectionStart, selectionEnd);
                            editor.replaceSelection(decryptedText, 'around');
                        }
                    };
                    decryptModal.open();
                }
            }
        });
    }
    removeMarkers(text) {
        if (text.startsWith(_PREFIX) && text.endsWith(_SUFFIX)) {
            return text.replace(_PREFIX, '').replace(_SUFFIX, '');
        }
        return text;
    }
    addMarkers(text) {
        if (!text.contains(_PREFIX) && !text.contains(_SUFFIX)) {
            return _PREFIX.concat(text, _SUFFIX);
        }
        return text;
    }
}

module.exports = MeldEncrypt;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsiLi4vbm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsIi4uL3NyYy9EZWNyeXB0TW9kYWwudHMiLCIuLi9zcmMvUGFzc3dvcmRNb2RhbC50cyIsIi4uL3NyYy9DcnlwdG9IZWxwZXIudHMiLCIuLi9zcmMvTWVsZEVuY3J5cHRTZXR0aW5nc1RhYi50cyIsIi4uL3NyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qISAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5Db3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi5cclxuXHJcblBlcm1pc3Npb24gdG8gdXNlLCBjb3B5LCBtb2RpZnksIGFuZC9vciBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUgZm9yIGFueVxyXG5wdXJwb3NlIHdpdGggb3Igd2l0aG91dCBmZWUgaXMgaGVyZWJ5IGdyYW50ZWQuXHJcblxyXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiIEFORCBUSEUgQVVUSE9SIERJU0NMQUlNUyBBTEwgV0FSUkFOVElFUyBXSVRIXHJcblJFR0FSRCBUTyBUSElTIFNPRlRXQVJFIElOQ0xVRElORyBBTEwgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWVxyXG5BTkQgRklUTkVTUy4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUiBCRSBMSUFCTEUgRk9SIEFOWSBTUEVDSUFMLCBESVJFQ1QsXHJcbklORElSRUNULCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUiBSRVNVTFRJTkcgRlJPTVxyXG5MT1NTIE9GIFVTRSwgREFUQSBPUiBQUk9GSVRTLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgTkVHTElHRU5DRSBPUlxyXG5PVEhFUiBUT1JUSU9VUyBBQ1RJT04sIEFSSVNJTkcgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgVVNFIE9SXHJcblBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuXHJcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXHJcbi8qIGdsb2JhbCBSZWZsZWN0LCBQcm9taXNlICovXHJcblxyXG52YXIgZXh0ZW5kU3RhdGljcyA9IGZ1bmN0aW9uKGQsIGIpIHtcclxuICAgIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcclxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XHJcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGIsIHApKSBkW3BdID0gYltwXTsgfTtcclxuICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXh0ZW5kcyhkLCBiKSB7XHJcbiAgICBpZiAodHlwZW9mIGIgIT09IFwiZnVuY3Rpb25cIiAmJiBiICE9PSBudWxsKVxyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDbGFzcyBleHRlbmRzIHZhbHVlIFwiICsgU3RyaW5nKGIpICsgXCIgaXMgbm90IGEgY29uc3RydWN0b3Igb3IgbnVsbFwiKTtcclxuICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XHJcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cclxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcclxufVxyXG5cclxuZXhwb3J0IHZhciBfX2Fzc2lnbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uIF9fYXNzaWduKHQpIHtcclxuICAgICAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcclxuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKSB0W3BdID0gc1twXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHQ7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVzdChzLCBlKSB7XHJcbiAgICB2YXIgdCA9IHt9O1xyXG4gICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApICYmIGUuaW5kZXhPZihwKSA8IDApXHJcbiAgICAgICAgdFtwXSA9IHNbcF07XHJcbiAgICBpZiAocyAhPSBudWxsICYmIHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIHAgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHMpOyBpIDwgcC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZS5pbmRleE9mKHBbaV0pIDwgMCAmJiBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwocywgcFtpXSkpXHJcbiAgICAgICAgICAgICAgICB0W3BbaV1dID0gc1twW2ldXTtcclxuICAgICAgICB9XHJcbiAgICByZXR1cm4gdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcclxuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xyXG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcclxuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3BhcmFtKHBhcmFtSW5kZXgsIGRlY29yYXRvcikge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIGtleSkgeyBkZWNvcmF0b3IodGFyZ2V0LCBrZXksIHBhcmFtSW5kZXgpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdGVyKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xyXG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XHJcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cclxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZ2VuZXJhdG9yKHRoaXNBcmcsIGJvZHkpIHtcclxuICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGc7XHJcbiAgICByZXR1cm4gZyA9IHsgbmV4dDogdmVyYigwKSwgXCJ0aHJvd1wiOiB2ZXJiKDEpLCBcInJldHVyblwiOiB2ZXJiKDIpIH0sIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc3RlcChvcCkge1xyXG4gICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcclxuICAgICAgICB3aGlsZSAoXykgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xyXG4gICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxyXG4gICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgdmFyIF9fY3JlYXRlQmluZGluZyA9IE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgazIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIG1ba107IH0gfSk7XHJcbn0pIDogKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgb1trMl0gPSBtW2tdO1xyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4cG9ydFN0YXIobSwgbykge1xyXG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAocCAhPT0gXCJkZWZhdWx0XCIgJiYgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvLCBwKSkgX19jcmVhdGVCaW5kaW5nKG8sIG0sIHApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX192YWx1ZXMobykge1xyXG4gICAgdmFyIHMgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgU3ltYm9sLml0ZXJhdG9yLCBtID0gcyAmJiBvW3NdLCBpID0gMDtcclxuICAgIGlmIChtKSByZXR1cm4gbS5jYWxsKG8pO1xyXG4gICAgaWYgKG8gJiYgdHlwZW9mIG8ubGVuZ3RoID09PSBcIm51bWJlclwiKSByZXR1cm4ge1xyXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKG8gJiYgaSA+PSBvLmxlbmd0aCkgbyA9IHZvaWQgMDtcclxuICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IG8gJiYgb1tpKytdLCBkb25lOiAhbyB9O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKHMgPyBcIk9iamVjdCBpcyBub3QgaXRlcmFibGUuXCIgOiBcIlN5bWJvbC5pdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3JlYWQobywgbikge1xyXG4gICAgdmFyIG0gPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb1tTeW1ib2wuaXRlcmF0b3JdO1xyXG4gICAgaWYgKCFtKSByZXR1cm4gbztcclxuICAgIHZhciBpID0gbS5jYWxsKG8pLCByLCBhciA9IFtdLCBlO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB3aGlsZSAoKG4gPT09IHZvaWQgMCB8fCBuLS0gPiAwKSAmJiAhKHIgPSBpLm5leHQoKSkuZG9uZSkgYXIucHVzaChyLnZhbHVlKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlcnJvcikgeyBlID0geyBlcnJvcjogZXJyb3IgfTsgfVxyXG4gICAgZmluYWxseSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHIgJiYgIXIuZG9uZSAmJiAobSA9IGlbXCJyZXR1cm5cIl0pKSBtLmNhbGwoaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkgeyBpZiAoZSkgdGhyb3cgZS5lcnJvcjsgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkKCkge1xyXG4gICAgZm9yICh2YXIgYXIgPSBbXSwgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgYXIgPSBhci5jb25jYXQoX19yZWFkKGFyZ3VtZW50c1tpXSkpO1xyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkQXJyYXlzKCkge1xyXG4gICAgZm9yICh2YXIgcyA9IDAsIGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSBzICs9IGFyZ3VtZW50c1tpXS5sZW5ndGg7XHJcbiAgICBmb3IgKHZhciByID0gQXJyYXkocyksIGsgPSAwLCBpID0gMDsgaSA8IGlsOyBpKyspXHJcbiAgICAgICAgZm9yICh2YXIgYSA9IGFyZ3VtZW50c1tpXSwgaiA9IDAsIGpsID0gYS5sZW5ndGg7IGogPCBqbDsgaisrLCBrKyspXHJcbiAgICAgICAgICAgIHJba10gPSBhW2pdO1xyXG4gICAgcmV0dXJuIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5KHRvLCBmcm9tKSB7XHJcbiAgICBmb3IgKHZhciBpID0gMCwgaWwgPSBmcm9tLmxlbmd0aCwgaiA9IHRvLmxlbmd0aDsgaSA8IGlsOyBpKyssIGorKylcclxuICAgICAgICB0b1tqXSA9IGZyb21baV07XHJcbiAgICByZXR1cm4gdG87XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0KHYpIHtcclxuICAgIHJldHVybiB0aGlzIGluc3RhbmNlb2YgX19hd2FpdCA/ICh0aGlzLnYgPSB2LCB0aGlzKSA6IG5ldyBfX2F3YWl0KHYpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY0dlbmVyYXRvcih0aGlzQXJnLCBfYXJndW1lbnRzLCBnZW5lcmF0b3IpIHtcclxuICAgIGlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTeW1ib2wuYXN5bmNJdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICB2YXIgZyA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSwgaSwgcSA9IFtdO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiKSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IGlmIChnW25dKSBpW25dID0gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChhLCBiKSB7IHEucHVzaChbbiwgdiwgYSwgYl0pID4gMSB8fCByZXN1bWUobiwgdik7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiByZXN1bWUobiwgdikgeyB0cnkgeyBzdGVwKGdbbl0odikpOyB9IGNhdGNoIChlKSB7IHNldHRsZShxWzBdWzNdLCBlKTsgfSB9XHJcbiAgICBmdW5jdGlvbiBzdGVwKHIpIHsgci52YWx1ZSBpbnN0YW5jZW9mIF9fYXdhaXQgPyBQcm9taXNlLnJlc29sdmUoci52YWx1ZS52KS50aGVuKGZ1bGZpbGwsIHJlamVjdCkgOiBzZXR0bGUocVswXVsyXSwgcik7IH1cclxuICAgIGZ1bmN0aW9uIGZ1bGZpbGwodmFsdWUpIHsgcmVzdW1lKFwibmV4dFwiLCB2YWx1ZSk7IH1cclxuICAgIGZ1bmN0aW9uIHJlamVjdCh2YWx1ZSkgeyByZXN1bWUoXCJ0aHJvd1wiLCB2YWx1ZSk7IH1cclxuICAgIGZ1bmN0aW9uIHNldHRsZShmLCB2KSB7IGlmIChmKHYpLCBxLnNoaWZ0KCksIHEubGVuZ3RoKSByZXN1bWUocVswXVswXSwgcVswXVsxXSk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNEZWxlZ2F0b3Iobykge1xyXG4gICAgdmFyIGksIHA7XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIsIGZ1bmN0aW9uIChlKSB7IHRocm93IGU7IH0pLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuLCBmKSB7IGlbbl0gPSBvW25dID8gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIChwID0gIXApID8geyB2YWx1ZTogX19hd2FpdChvW25dKHYpKSwgZG9uZTogbiA9PT0gXCJyZXR1cm5cIiB9IDogZiA/IGYodikgOiB2OyB9IDogZjsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY1ZhbHVlcyhvKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIG0gPSBvW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSwgaTtcclxuICAgIHJldHVybiBtID8gbS5jYWxsKG8pIDogKG8gPSB0eXBlb2YgX192YWx1ZXMgPT09IFwiZnVuY3Rpb25cIiA/IF9fdmFsdWVzKG8pIDogb1tTeW1ib2wuaXRlcmF0b3JdKCksIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiKSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpKTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpW25dID0gb1tuXSAmJiBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgeyB2ID0gb1tuXSh2KSwgc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgdi5kb25lLCB2LnZhbHVlKTsgfSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHNldHRsZShyZXNvbHZlLCByZWplY3QsIGQsIHYpIHsgUHJvbWlzZS5yZXNvbHZlKHYpLnRoZW4oZnVuY3Rpb24odikgeyByZXNvbHZlKHsgdmFsdWU6IHYsIGRvbmU6IGQgfSk7IH0sIHJlamVjdCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWFrZVRlbXBsYXRlT2JqZWN0KGNvb2tlZCwgcmF3KSB7XHJcbiAgICBpZiAoT2JqZWN0LmRlZmluZVByb3BlcnR5KSB7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjb29rZWQsIFwicmF3XCIsIHsgdmFsdWU6IHJhdyB9KTsgfSBlbHNlIHsgY29va2VkLnJhdyA9IHJhdzsgfVxyXG4gICAgcmV0dXJuIGNvb2tlZDtcclxufTtcclxuXHJcbnZhciBfX3NldE1vZHVsZURlZmF1bHQgPSBPYmplY3QuY3JlYXRlID8gKGZ1bmN0aW9uKG8sIHYpIHtcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBcImRlZmF1bHRcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdiB9KTtcclxufSkgOiBmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBvW1wiZGVmYXVsdFwiXSA9IHY7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19pbXBvcnRTdGFyKG1vZCkge1xyXG4gICAgaWYgKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgcmV0dXJuIG1vZDtcclxuICAgIHZhciByZXN1bHQgPSB7fTtcclxuICAgIGlmIChtb2QgIT0gbnVsbCkgZm9yICh2YXIgayBpbiBtb2QpIGlmIChrICE9PSBcImRlZmF1bHRcIiAmJiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobW9kLCBrKSkgX19jcmVhdGVCaW5kaW5nKHJlc3VsdCwgbW9kLCBrKTtcclxuICAgIF9fc2V0TW9kdWxlRGVmYXVsdChyZXN1bHQsIG1vZCk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19pbXBvcnREZWZhdWx0KG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBkZWZhdWx0OiBtb2QgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRHZXQocmVjZWl2ZXIsIHByaXZhdGVNYXApIHtcclxuICAgIGlmICghcHJpdmF0ZU1hcC5oYXMocmVjZWl2ZXIpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImF0dGVtcHRlZCB0byBnZXQgcHJpdmF0ZSBmaWVsZCBvbiBub24taW5zdGFuY2VcIik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcHJpdmF0ZU1hcC5nZXQocmVjZWl2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZFNldChyZWNlaXZlciwgcHJpdmF0ZU1hcCwgdmFsdWUpIHtcclxuICAgIGlmICghcHJpdmF0ZU1hcC5oYXMocmVjZWl2ZXIpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImF0dGVtcHRlZCB0byBzZXQgcHJpdmF0ZSBmaWVsZCBvbiBub24taW5zdGFuY2VcIik7XHJcbiAgICB9XHJcbiAgICBwcml2YXRlTWFwLnNldChyZWNlaXZlciwgdmFsdWUpO1xyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG59XHJcbiIsImltcG9ydCB7IEFwcCwgTW9kYWwgfSBmcm9tICdvYnNpZGlhbic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEZWNyeXB0TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XHJcblx0dGV4dDogc3RyaW5nO1xyXG5cdGRlY3J5cHRJblBsYWNlOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG5cdGNvbnN0cnVjdG9yKGFwcDogQXBwLCB0aXRsZTogc3RyaW5nLCB0ZXh0OiBzdHJpbmcgPSAnJykge1xyXG5cdFx0c3VwZXIoYXBwKTtcclxuXHRcdHRoaXMudGV4dCA9IHRleHQ7XHJcblx0XHR0aGlzLnRpdGxlRWwuaW5uZXJUZXh0ID0gdGl0bGU7XHJcblx0fVxyXG5cclxuXHRvbk9wZW4oKSB7XHJcblx0XHRsZXQgeyBjb250ZW50RWwgfSA9IHRoaXM7XHJcblxyXG5cdFx0Y29uc3QgdGV4dEVsID0gY29udGVudEVsLmNyZWF0ZURpdigpLmNyZWF0ZUVsKCd0ZXh0YXJlYScsIHsgdGV4dDogdGhpcy50ZXh0IH0pO1xyXG5cdFx0dGV4dEVsLnN0eWxlLndpZHRoID0gJzEwMCUnO1xyXG5cdFx0dGV4dEVsLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcclxuXHRcdHRleHRFbC5yb3dzID0gMTA7XHJcblx0XHR0ZXh0RWwucmVhZE9ubHkgPSB0cnVlO1xyXG5cdFx0Ly90ZXh0RWwuZm9jdXMoKTsgLy8gRG9lc24ndCBzZWVtIHRvIHdvcmsgaGVyZS4uLlxyXG5cdFx0c2V0SW1tZWRpYXRlKCgpID0+IHsgdGV4dEVsLmZvY3VzKCkgfSk7IC8vLi4uIGJ1dCB0aGlzIGRvZXNcclxuXHJcblxyXG5cdFx0Y29uc3QgYnRuQ29udGFpbmVyRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KCcnKTtcclxuXHJcblx0XHRjb25zdCBkZWNyeXB0SW5QbGFjZUJ0bkVsID0gYnRuQ29udGFpbmVyRWwuY3JlYXRlRWwoJ2J1dHRvbicsIHsgdGV4dDogJ0RlY3J5cHQgaW4tcGxhY2UnIH0pO1xyXG5cdFx0ZGVjcnlwdEluUGxhY2VCdG5FbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuXHRcdFx0dGhpcy5kZWNyeXB0SW5QbGFjZSA9IHRydWU7XHJcblx0XHRcdHRoaXMuY2xvc2UoKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdGNvbnN0IGNhbmNlbEJ0bkVsID0gYnRuQ29udGFpbmVyRWwuY3JlYXRlRWwoJ2J1dHRvbicsIHsgdGV4dDogJ0Nsb3NlJyB9KTtcclxuXHRcdGNhbmNlbEJ0bkVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG5cdFx0XHR0aGlzLmNsb3NlKCk7XHJcblx0XHR9KTtcclxuXHJcblx0fVxyXG5cclxufSIsImltcG9ydCB7IEFwcCwgTW9kYWwgfSBmcm9tICdvYnNpZGlhbic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQYXNzd29yZE1vZGFsIGV4dGVuZHMgTW9kYWwge1xyXG5cdHBhc3N3b3JkOiBzdHJpbmcgPSBudWxsO1xyXG5cdGRlZmF1bHRQYXNzd29yZDogc3RyaW5nID0gbnVsbDtcclxuXHRjb25maXJtUGFzc3dvcmQ6IGJvb2xlYW47XHJcblxyXG5cdGNvbnN0cnVjdG9yKGFwcDogQXBwLCBjb25maXJtUGFzc3dvcmQ6IGJvb2xlYW4sIGRlZmF1bHRQYXNzd29yZDogc3RyaW5nID0gbnVsbCkge1xyXG5cdFx0c3VwZXIoYXBwKTtcclxuXHRcdHRoaXMuZGVmYXVsdFBhc3N3b3JkID0gZGVmYXVsdFBhc3N3b3JkO1xyXG5cdFx0dGhpcy5jb25maXJtUGFzc3dvcmQgPSBjb25maXJtUGFzc3dvcmQ7XHJcblx0fVxyXG5cclxuXHRvbk9wZW4oKSB7XHJcblx0XHRsZXQgeyBjb250ZW50RWwgfSA9IHRoaXM7XHJcblxyXG5cdFx0Y29udGVudEVsLmVtcHR5KCk7XHJcblxyXG5cdFx0Y29uc3QgcHdJbnB1dEVsID0gY29udGVudEVsLmNyZWF0ZURpdigpXHJcblx0XHRcdC5jcmVhdGVTcGFuKHsgdGV4dDogJ/CflJEgJyB9KVxyXG5cdFx0XHQuY3JlYXRlRWwoJ2lucHV0JywgeyB0eXBlOiAncGFzc3dvcmQnLCB2YWx1ZTogdGhpcy5kZWZhdWx0UGFzc3dvcmQgPz8gJycgfSlcclxuXHRcdFx0O1xyXG5cclxuXHRcdHB3SW5wdXRFbC5wbGFjZWhvbGRlciA9ICdFbnRlciB5b3VyIHBhc3N3b3JkJztcclxuXHRcdHB3SW5wdXRFbC5zdHlsZS53aWR0aCA9ICc5MyUnO1xyXG5cdFx0cHdJbnB1dEVsLmZvY3VzKCk7XHJcblxyXG5cdFx0Y29uc3QgY29uZmlybVB3Q29udGFpbmVyRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KCk7XHJcblxyXG5cdFx0Y29uc3QgcHdDb25maXJtSW5wdXRFbCA9IGNvbmZpcm1Qd0NvbnRhaW5lckVsXHJcblx0XHRcdC5jcmVhdGVTcGFuKHsgdGV4dDogJ/CflJEgJyB9KVxyXG5cdFx0XHQuY3JlYXRlRWwoJ2lucHV0JywgeyB0eXBlOiAncGFzc3dvcmQnLCB2YWx1ZTogdGhpcy5kZWZhdWx0UGFzc3dvcmQgPz8gJycgfSlcclxuXHRcdFx0O1xyXG5cclxuXHRcdHB3Q29uZmlybUlucHV0RWwucGxhY2Vob2xkZXIgPSAnQ29uZmlybSB5b3VyIHBhc3N3b3JkJztcclxuXHRcdHB3Q29uZmlybUlucHV0RWwuc3R5bGUud2lkdGggPSAnOTMlJztcclxuXHJcblx0XHRwd0NvbmZpcm1JbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXByZXNzJywgKGV2KSA9PiB7XHJcblx0XHRcdGlmIChldi5jb2RlID09PSAnRW50ZXInICYmIHB3Q29uZmlybUlucHV0RWwudmFsdWUubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRcdGV2LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0XHRcdGlmIChwd0lucHV0RWwudmFsdWUgPT0gcHdDb25maXJtSW5wdXRFbC52YWx1ZSl7XHJcblx0XHRcdFx0XHR0aGlzLnBhc3N3b3JkID0gcHdDb25maXJtSW5wdXRFbC52YWx1ZTtcclxuXHRcdFx0XHRcdHRoaXMuY2xvc2UoKTtcclxuXHRcdFx0XHR9ZWxzZXtcclxuXHRcdFx0XHRcdC8vIHBhc3N3b3JkcyBkb24ndCBtYXRjaFxyXG5cdFx0XHRcdFx0bWVzc2FnZUVsLnNldFRleHQoJ1Bhc3N3b3JkcyBkb25cXCd0IG1hdGNoJyk7XHJcblx0XHRcdFx0XHRtZXNzYWdlRWwuc2hvdygpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdFx0XHJcblx0XHRjb25maXJtUHdDb250YWluZXJFbC5zdHlsZS5tYXJnaW5Ub3AgPSAnMWVtJztcclxuXHJcblx0XHRpZiAoIXRoaXMuY29uZmlybVBhc3N3b3JkKSB7XHJcblx0XHRcdGNvbmZpcm1Qd0NvbnRhaW5lckVsLmhpZGUoKTtcclxuXHRcdH1cclxuXHJcblx0XHRjb25zdCBtZXNzYWdlRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KCk7XHJcblx0XHRtZXNzYWdlRWwuc3R5bGUubWFyZ2luVG9wID0gJzFlbSc7XHJcblx0XHRtZXNzYWdlRWwuaGlkZSgpO1xyXG5cclxuXHRcdHB3SW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKCdrZXlwcmVzcycsIChldikgPT4ge1xyXG5cdFx0XHRpZiAoZXYuY29kZSA9PT0gJ0VudGVyJyAmJiBwd0lucHV0RWwudmFsdWUubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRcdGV2LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0aWYgKHRoaXMuY29uZmlybVBhc3N3b3JkKSB7XHJcblx0XHRcdFx0XHQvLyBjb25maW0gcGFzc3dvcmRcclxuXHRcdFx0XHRcdHB3Q29uZmlybUlucHV0RWwuZm9jdXMoKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhpcy5wYXNzd29yZCA9IHB3SW5wdXRFbC52YWx1ZTtcclxuXHRcdFx0XHRcdHRoaXMuY2xvc2UoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cclxuXHR9XHJcblxyXG59IiwiXHJcbmNvbnN0IGFsZ29yaXRobSA9IHtcclxuXHRuYW1lOiAnQUVTLUdDTScsXHJcblx0aXY6IG5ldyBVaW50OEFycmF5KFsxOTYsIDE5MCwgMjQwLCAxOTAsIDE4OCwgNzgsIDQxLCAxMzIsIDE1LCAyMjAsIDg0LCAyMTFdKSxcclxuXHR0YWdMZW5ndGg6IDEyOFxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDcnlwdG9IZWxwZXIge1xyXG5cclxuXHRwcml2YXRlIGFzeW5jIGJ1aWxkS2V5KHBhc3N3b3JkOiBzdHJpbmcpIHtcclxuXHRcdGxldCB1dGY4RW5jb2RlID0gbmV3IFRleHRFbmNvZGVyKCk7XHJcblx0XHRsZXQgcGFzc3dvcmRCeXRlcyA9IHV0ZjhFbmNvZGUuZW5jb2RlKHBhc3N3b3JkKTtcclxuXHJcblx0XHRsZXQgcGFzc3dvcmREaWdlc3QgPSBhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdCh7IG5hbWU6ICdTSEEtMjU2JyB9LCBwYXNzd29yZEJ5dGVzKTtcclxuXHJcblx0XHRsZXQga2V5ID0gYXdhaXQgY3J5cHRvLnN1YnRsZS5pbXBvcnRLZXkoXHJcblx0XHRcdCdyYXcnLFxyXG5cdFx0XHRwYXNzd29yZERpZ2VzdCxcclxuXHRcdFx0YWxnb3JpdGhtLFxyXG5cdFx0XHRmYWxzZSxcclxuXHRcdFx0WydlbmNyeXB0JywgJ2RlY3J5cHQnXVxyXG5cdFx0KTtcclxuXHJcblx0XHRyZXR1cm4ga2V5O1xyXG5cdH1cclxuXHJcblx0cHVibGljIGFzeW5jIGVuY3J5cHRUb0Jhc2U2NCh0ZXh0OiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xyXG5cdFx0bGV0IGtleSA9IGF3YWl0IHRoaXMuYnVpbGRLZXkocGFzc3dvcmQpO1xyXG5cclxuXHRcdGxldCB1dGY4RW5jb2RlID0gbmV3IFRleHRFbmNvZGVyKCk7XHJcblx0XHRsZXQgYnl0ZXNUb0VuY3J5cHQgPSB1dGY4RW5jb2RlLmVuY29kZSh0ZXh0KTtcclxuXHJcblx0XHQvLyBlbmNyeXB0IGludG8gYnl0ZXNcclxuXHRcdGxldCBlbmNyeXB0ZWRCeXRlcyA9IG5ldyBVaW50OEFycmF5KGF3YWl0IGNyeXB0by5zdWJ0bGUuZW5jcnlwdChcclxuXHRcdFx0YWxnb3JpdGhtLCBrZXksIGJ5dGVzVG9FbmNyeXB0XHJcblx0XHQpKTtcclxuXHJcblx0XHQvL2NvbnZlcnQgYXJyYXkgdG8gYmFzZTY0XHJcblx0XHRsZXQgYmFzZTY0VGV4dCA9IGJ0b2EoU3RyaW5nLmZyb21DaGFyQ29kZSguLi5lbmNyeXB0ZWRCeXRlcykpO1xyXG5cclxuXHRcdHJldHVybiBiYXNlNjRUZXh0O1xyXG5cdH1cclxuXHJcblx0cHJpdmF0ZSBzdHJpbmdUb0FycmF5KHN0cjogc3RyaW5nKTogVWludDhBcnJheSB7XHJcblx0XHR2YXIgcmVzdWx0ID0gW107XHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRyZXN1bHQucHVzaChzdHIuY2hhckNvZGVBdChpKSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gbmV3IFVpbnQ4QXJyYXkocmVzdWx0KTtcclxuXHR9XHJcblxyXG5cdHB1YmxpYyBhc3luYyBkZWNyeXB0RnJvbUJhc2U2NChiYXNlNjRFbmNvZGVkOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xyXG5cdFx0dHJ5IHtcclxuXHRcdFx0Ly8gY29udmVydCBiYXNlIDY0IHRvIGFycmF5XHJcblx0XHRcdGxldCBieXRlc1RvRGVjcnlwdCA9IHRoaXMuc3RyaW5nVG9BcnJheShhdG9iKGJhc2U2NEVuY29kZWQpKTtcclxuXHJcblx0XHRcdGxldCBrZXkgPSBhd2FpdCB0aGlzLmJ1aWxkS2V5KHBhc3N3b3JkKTtcclxuXHJcblx0XHRcdC8vIGRlY3J5cHQgaW50byBieXRlc1xyXG5cdFx0XHRsZXQgZGVjcnlwdGVkQnl0ZXMgPSBhd2FpdCBjcnlwdG8uc3VidGxlLmRlY3J5cHQoYWxnb3JpdGhtLCBrZXksIGJ5dGVzVG9EZWNyeXB0KTtcclxuXHJcblx0XHRcdC8vIGNvbnZlcnQgYnl0ZXMgdG8gdGV4dFxyXG5cdFx0XHRsZXQgdXRmOERlY29kZSA9IG5ldyBUZXh0RGVjb2RlcigpO1xyXG5cdFx0XHRsZXQgZGVjcnlwdGVkVGV4dCA9IHV0ZjhEZWNvZGUuZGVjb2RlKGRlY3J5cHRlZEJ5dGVzKTtcclxuXHRcdFx0cmV0dXJuIGRlY3J5cHRlZFRleHQ7XHJcblx0XHR9IGNhdGNoIChlKSB7XHJcblx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgQXBwLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nLCBTbGlkZXJDb21wb25lbnQgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IE1lbGRFbmNyeXB0IGZyb20gXCIuL21haW5cIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1lbGRFbmNyeXB0U2V0dGluZ3NUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcclxuXHRwbHVnaW46IE1lbGRFbmNyeXB0O1xyXG5cclxuXHRwd1RpbWVvdXRTZXR0aW5nOlNldHRpbmc7XHJcblxyXG5cdGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IE1lbGRFbmNyeXB0KSB7XHJcblx0XHRzdXBlcihhcHAsIHBsdWdpbik7XHJcblx0XHR0aGlzLnBsdWdpbiA9IHBsdWdpbjtcclxuXHR9XHJcblxyXG5cdGRpc3BsYXkoKTogdm9pZCB7XHJcblx0XHRsZXQgeyBjb250YWluZXJFbCB9ID0gdGhpcztcclxuXHJcblx0XHRjb250YWluZXJFbC5lbXB0eSgpO1xyXG5cclxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG5cdFx0LnNldE5hbWUoJ0NvbmZpcm0gcGFzc3dvcmQ/JylcclxuXHRcdC5zZXREZXNjKCdDb25maXJtIHBhc3N3b3JkIHdoZW4gZW5jcnlwdGluZy4nKVxyXG5cdFx0LmFkZFRvZ2dsZSggdG9nZ2xlID0+e1xyXG5cdFx0XHR0b2dnbGVcclxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29uZmlybVBhc3N3b3JkKVxyXG5cdFx0XHRcdC5vbkNoYW5nZSggYXN5bmMgdmFsdWUgPT57XHJcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb25maXJtUGFzc3dvcmQgPSB2YWx1ZTtcclxuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG5cdFx0XHRcdFx0dGhpcy51cGRhdGVTZXR0aW5nc1VpKCk7XHJcblx0XHRcdFx0fSlcclxuXHRcdH0pXHJcblx0O1xyXG5cclxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG5cdFx0XHQuc2V0TmFtZSgnUmVtZW1iZXIgcGFzc3dvcmQ/JylcclxuXHRcdFx0LnNldERlc2MoJ1JlbWVtYmVyIHRoZSBsYXN0IHVzZWQgcGFzc3dvcmQgZm9yIHRoaXMgc2Vzc2lvbi4nKVxyXG5cdFx0XHQuYWRkVG9nZ2xlKCB0b2dnbGUgPT57XHJcblx0XHRcdFx0dG9nZ2xlXHJcblx0XHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucmVtZW1iZXJQYXNzd29yZClcclxuXHRcdFx0XHRcdC5vbkNoYW5nZSggYXN5bmMgdmFsdWUgPT57XHJcblx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnJlbWVtYmVyUGFzc3dvcmQgPSB2YWx1ZTtcclxuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XHJcblx0XHRcdFx0XHRcdHRoaXMudXBkYXRlU2V0dGluZ3NVaSgpO1xyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0fSlcclxuXHRcdDtcclxuXHJcblx0XHR0aGlzLnB3VGltZW91dFNldHRpbmcgPSBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuXHRcdFx0LnNldE5hbWUoIHRoaXMuYnVpbGRQYXNzd29yZFRpbWVvdXRTZXR0aW5nTmFtZSgpIClcclxuXHRcdFx0LnNldERlc2MoJ1RoZSBudW1iZXIgb2YgbWludXRlcyB0byByZW1lbWJlciB0aGUgbGFzdCB1c2VkIHBhc3N3b3JkLicpXHJcblx0XHRcdC5hZGRTbGlkZXIoIHNsaWRlciA9PiB7XHJcblx0XHRcdFx0c2xpZGVyXHJcblx0XHRcdFx0XHQuc2V0TGltaXRzKDAsIDEyMCwgNSlcclxuXHRcdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZW1lbWJlclBhc3N3b3JkVGltZW91dClcclxuXHRcdFx0XHRcdC5vbkNoYW5nZSggYXN5bmMgdmFsdWUgPT4ge1xyXG5cdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZW1lbWJlclBhc3N3b3JkVGltZW91dCA9IHZhbHVlO1xyXG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcclxuXHRcdFx0XHRcdFx0dGhpcy51cGRhdGVTZXR0aW5nc1VpKCk7XHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdDtcclxuXHRcdFx0XHRcclxuXHRcdFx0fSlcclxuXHRcdDtcclxuXHJcblx0XHR0aGlzLnVwZGF0ZVNldHRpbmdzVWkoKTtcclxuXHR9XHJcblxyXG5cdHVwZGF0ZVNldHRpbmdzVWkoKTp2b2lke1xyXG5cdFx0dGhpcy5wd1RpbWVvdXRTZXR0aW5nLnNldE5hbWUodGhpcy5idWlsZFBhc3N3b3JkVGltZW91dFNldHRpbmdOYW1lKCkpO1xyXG5cclxuXHRcdGlmICggdGhpcy5wbHVnaW4uc2V0dGluZ3MucmVtZW1iZXJQYXNzd29yZCApe1xyXG5cdFx0XHR0aGlzLnB3VGltZW91dFNldHRpbmcuc2V0dGluZ0VsLnNob3coKTtcclxuXHRcdH1lbHNle1xyXG5cdFx0XHR0aGlzLnB3VGltZW91dFNldHRpbmcuc2V0dGluZ0VsLmhpZGUoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGJ1aWxkUGFzc3dvcmRUaW1lb3V0U2V0dGluZ05hbWUoKTpzdHJpbmd7XHJcblx0XHRjb25zdCB2YWx1ZSA9IHRoaXMucGx1Z2luLnNldHRpbmdzLnJlbWVtYmVyUGFzc3dvcmRUaW1lb3V0O1xyXG5cdFx0bGV0IHRpbWVvdXRTdHJpbmcgPSBgJHt2YWx1ZX0gbWludXRlc2A7XHJcblx0XHRpZih2YWx1ZSA9PSAwKXtcclxuXHRcdFx0dGltZW91dFN0cmluZyA9ICdOZXZlciBmb3JnZXQnO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGBSZW1lbWJlciBQYXNzd29yZCBUaW1lb3V0ICgke3RpbWVvdXRTdHJpbmd9KWA7XHJcblx0fVxyXG59IiwiaW1wb3J0IHsgTm90aWNlLCBQbHVnaW4sIE1hcmtkb3duVmlldyB9IGZyb20gJ29ic2lkaWFuJztcclxuaW1wb3J0IERlY3J5cHRNb2RhbCBmcm9tICcuL0RlY3J5cHRNb2RhbCc7XHJcbmltcG9ydCBQYXNzd29yZE1vZGFsIGZyb20gJy4vUGFzc3dvcmRNb2RhbCc7XHJcbmltcG9ydCBDcnlwdG9IZWxwZXIgZnJvbSAnLi9DcnlwdG9IZWxwZXInO1xyXG5pbXBvcnQgTWVsZEVuY3J5cHRTZXR0aW5nc1RhYiBmcm9tICcuL01lbGRFbmNyeXB0U2V0dGluZ3NUYWInO1xyXG5cclxuY29uc3QgX1BSRUZJWDogc3RyaW5nID0gJyUl8J+UkCAnO1xyXG5jb25zdCBfU1VGRklYOiBzdHJpbmcgPSAnIPCflJAlJSc7XHJcblxyXG5pbnRlcmZhY2UgTWVsZEVuY3J5cHRQbHVnaW5TZXR0aW5ncyB7XHJcblx0Y29uZmlybVBhc3N3b3JkOiBib29sZWFuO1xyXG5cdHJlbWVtYmVyUGFzc3dvcmQ6IGJvb2xlYW47XHJcblx0cmVtZW1iZXJQYXNzd29yZFRpbWVvdXQ6IG51bWJlcjtcclxufVxyXG5cclxuY29uc3QgREVGQVVMVF9TRVRUSU5HUzogTWVsZEVuY3J5cHRQbHVnaW5TZXR0aW5ncyA9IHtcclxuXHRjb25maXJtUGFzc3dvcmQ6IHRydWUsXHJcblx0cmVtZW1iZXJQYXNzd29yZDogdHJ1ZSxcclxuXHRyZW1lbWJlclBhc3N3b3JkVGltZW91dDogMzBcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWVsZEVuY3J5cHQgZXh0ZW5kcyBQbHVnaW4ge1xyXG5cclxuXHRzZXR0aW5nczogTWVsZEVuY3J5cHRQbHVnaW5TZXR0aW5ncztcclxuXHRwYXNzd29yZExhc3RVc2VkRXhwaXJ5OiBudW1iZXJcclxuXHRwYXNzd29yZExhc3RVc2VkOiBzdHJpbmc7XHJcblxyXG5cdGFzeW5jIG9ubG9hZCgpIHtcclxuXHJcblx0XHRhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xyXG5cclxuXHRcdHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgTWVsZEVuY3J5cHRTZXR0aW5nc1RhYih0aGlzLmFwcCwgdGhpcykpO1xyXG5cclxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XHJcblx0XHRcdGlkOiAnZW5jcnlwdC1kZWNyeXB0JyxcclxuXHRcdFx0bmFtZTogJ0VuY3J5cHQvRGVjcnlwdCcsXHJcblx0XHRcdGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZykgPT4gdGhpcy5wcm9jZXNzRW5jcnlwdERlY3J5cHRDb21tYW5kKGNoZWNraW5nLCBmYWxzZSlcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XHJcblx0XHRcdGlkOiAnZW5jcnlwdC1kZWNyeXB0LWluLXBsYWNlJyxcclxuXHRcdFx0bmFtZTogJ0VuY3J5cHQvRGVjcnlwdCBJbi1wbGFjZScsXHJcblx0XHRcdGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZykgPT4gdGhpcy5wcm9jZXNzRW5jcnlwdERlY3J5cHRDb21tYW5kKGNoZWNraW5nLCB0cnVlKVxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRhc3luYyBsb2FkU2V0dGluZ3MoKSB7XHJcblx0XHR0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcclxuXHR9XHJcblxyXG5cdGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcclxuXHRcdGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XHJcblx0fVxyXG5cclxuXHRwcm9jZXNzRW5jcnlwdERlY3J5cHRDb21tYW5kKGNoZWNraW5nOiBib29sZWFuLCBkZWNyeXB0SW5QbGFjZTogYm9vbGVhbik6IGJvb2xlYW4ge1xyXG5cclxuXHRcdGNvbnN0IG1kdmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XHJcblx0XHRpZiAoIW1kdmlldykge1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblxyXG5cdFx0Y29uc3QgZWRpdG9yID0gbWR2aWV3LnNvdXJjZU1vZGUuY21FZGl0b3I7XHJcblx0XHRpZiAoIWVkaXRvcikge1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblxyXG5cdFx0Y29uc3Qgc3RhcnRMaW5lID0gZWRpdG9yLmdldEN1cnNvcignZnJvbScpLmxpbmU7XHJcblx0XHRjb25zdCBzdGFydFBvcyA9IHsgbGluZTogc3RhcnRMaW5lLCBjaDogMCB9OyAvLyB3YW50IHRoZSBzdGFydCBvZiB0aGUgZmlyc3QgbGluZVxyXG5cclxuXHRcdGNvbnN0IGVuZExpbmUgPSBlZGl0b3IuZ2V0Q3Vyc29yKCd0bycpLmxpbmU7XHJcblx0XHRjb25zdCBlbmRMaW5lVGV4dCA9IGVkaXRvci5nZXRMaW5lKGVuZExpbmUpO1xyXG5cdFx0Y29uc3QgZW5kUG9zID0geyBsaW5lOiBlbmRMaW5lLCBjaDogZW5kTGluZVRleHQubGVuZ3RoIH07IC8vIHdhbnQgdGhlIGVuZCBvZiBsYXN0IGxpbmVcclxuXHJcblx0XHRjb25zdCBzZWxlY3Rpb25UZXh0ID0gZWRpdG9yLmdldFJhbmdlKHN0YXJ0UG9zLCBlbmRQb3MpO1xyXG5cclxuXHRcdGlmIChzZWxlY3Rpb25UZXh0Lmxlbmd0aCA9PSAwKSB7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHJcblx0XHRjb25zdCBkZWNyeXB0ID0gc2VsZWN0aW9uVGV4dC5zdGFydHNXaXRoKF9QUkVGSVgpICYmIHNlbGVjdGlvblRleHQuZW5kc1dpdGgoX1NVRkZJWCk7XHJcblx0XHRjb25zdCBlbmNyeXB0ID0gIXNlbGVjdGlvblRleHQuY29udGFpbnMoX1BSRUZJWCkgJiYgIXNlbGVjdGlvblRleHQuY29udGFpbnMoX1NVRkZJWCk7XHJcblxyXG5cdFx0aWYgKCFkZWNyeXB0ICYmICFlbmNyeXB0KSB7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoY2hlY2tpbmcpIHtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gRmV0Y2ggcGFzc3dvcmQgZnJvbSB1c2VyXHJcblxyXG5cdFx0Ly8gZGV0ZXJtaW5lIGRlZmF1bHQgcGFzc3dvcmRcclxuXHRcdGNvbnN0IGlzUmVtZW1iZXJQYXNzd29yZEV4cGlyZWQgPVxyXG5cdFx0XHQhdGhpcy5zZXR0aW5ncy5yZW1lbWJlclBhc3N3b3JkXHJcblx0XHRcdHx8IChcclxuXHRcdFx0XHR0aGlzLnBhc3N3b3JkTGFzdFVzZWRFeHBpcnkgIT0gbnVsbFxyXG5cdFx0XHRcdCYmIERhdGUubm93KCkgPiB0aGlzLnBhc3N3b3JkTGFzdFVzZWRFeHBpcnlcclxuXHRcdFx0KVxyXG5cdFx0XHQ7XHJcblxyXG5cdFx0aWYgKGlzUmVtZW1iZXJQYXNzd29yZEV4cGlyZWQpIHtcclxuXHRcdFx0dGhpcy5wYXNzd29yZExhc3RVc2VkID0gJyc7XHJcblx0XHR9XHJcblxyXG5cdFx0Y29uc3QgY29uZmlybVBhc3N3b3JkID0gZW5jcnlwdCAmJiB0aGlzLnNldHRpbmdzLmNvbmZpcm1QYXNzd29yZDtcclxuXHJcblx0XHRjb25zdCBwd01vZGFsID0gbmV3IFBhc3N3b3JkTW9kYWwodGhpcy5hcHAsIGNvbmZpcm1QYXNzd29yZCwgdGhpcy5wYXNzd29yZExhc3RVc2VkKTtcclxuXHRcdHB3TW9kYWwub25DbG9zZSA9ICgpID0+IHtcclxuXHRcdFx0Y29uc3QgcHcgPSBwd01vZGFsLnBhc3N3b3JkID8/ICcnXHJcblx0XHRcdGlmIChwdy5sZW5ndGggPT0gMCkge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gcmVtZW1iZXIgcGFzc3dvcmQ/XHJcblx0XHRcdGlmICh0aGlzLnNldHRpbmdzLnJlbWVtYmVyUGFzc3dvcmQpIHtcclxuXHRcdFx0XHR0aGlzLnBhc3N3b3JkTGFzdFVzZWQgPSBwdztcclxuXHRcdFx0XHR0aGlzLnBhc3N3b3JkTGFzdFVzZWRFeHBpcnkgPVxyXG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5yZW1lbWJlclBhc3N3b3JkVGltZW91dCA9PSAwXHJcblx0XHRcdFx0XHRcdD8gbnVsbFxyXG5cdFx0XHRcdFx0XHQ6IERhdGUubm93KCkgKyB0aGlzLnNldHRpbmdzLnJlbWVtYmVyUGFzc3dvcmRUaW1lb3V0ICogMTAwMCAqIDYwLy8gbmV3IGV4cGlyeVxyXG5cdFx0XHRcdFx0O1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoZW5jcnlwdCkge1xyXG5cdFx0XHRcdHRoaXMuZW5jcnlwdFNlbGVjdGlvbihcclxuXHRcdFx0XHRcdGVkaXRvcixcclxuXHRcdFx0XHRcdHNlbGVjdGlvblRleHQsXHJcblx0XHRcdFx0XHRwdyxcclxuXHRcdFx0XHRcdHN0YXJ0UG9zLFxyXG5cdFx0XHRcdFx0ZW5kUG9zXHJcblx0XHRcdFx0KTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLmRlY3J5cHRTZWxlY3Rpb24oXHJcblx0XHRcdFx0XHRlZGl0b3IsXHJcblx0XHRcdFx0XHRzZWxlY3Rpb25UZXh0LFxyXG5cdFx0XHRcdFx0cHcsXHJcblx0XHRcdFx0XHRzdGFydFBvcyxcclxuXHRcdFx0XHRcdGVuZFBvcyxcclxuXHRcdFx0XHRcdGRlY3J5cHRJblBsYWNlXHJcblx0XHRcdFx0KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cHdNb2RhbC5vcGVuKCk7XHJcblxyXG5cdFx0cmV0dXJuIHRydWU7XHJcblx0fVxyXG5cclxuXHRwcml2YXRlIGFzeW5jIGVuY3J5cHRTZWxlY3Rpb24oXHJcblx0XHRlZGl0b3I6IENvZGVNaXJyb3IuRWRpdG9yLFxyXG5cdFx0c2VsZWN0aW9uVGV4dDogc3RyaW5nLFxyXG5cdFx0cGFzc3dvcmQ6IHN0cmluZyxcclxuXHRcdGZpbmFsU2VsZWN0aW9uU3RhcnQ6IENvZGVNaXJyb3IuUG9zaXRpb24sXHJcblx0XHRmaW5hbFNlbGVjdGlvbkVuZDogQ29kZU1pcnJvci5Qb3NpdGlvbixcclxuXHQpIHtcclxuXHRcdC8vZW5jcnlwdFxyXG5cdFx0Y29uc3QgY3J5cHRvID0gbmV3IENyeXB0b0hlbHBlcigpO1xyXG5cdFx0Y29uc3QgYmFzZTY0RW5jcnlwdGVkVGV4dCA9IHRoaXMuYWRkTWFya2Vycyhhd2FpdCBjcnlwdG8uZW5jcnlwdFRvQmFzZTY0KHNlbGVjdGlvblRleHQsIHBhc3N3b3JkKSk7XHJcblx0XHRlZGl0b3Iuc2V0U2VsZWN0aW9uKGZpbmFsU2VsZWN0aW9uU3RhcnQsIGZpbmFsU2VsZWN0aW9uRW5kKTtcclxuXHRcdGVkaXRvci5yZXBsYWNlU2VsZWN0aW9uKGJhc2U2NEVuY3J5cHRlZFRleHQsICdhcm91bmQnKTtcclxuXHR9XHJcblxyXG5cdHByaXZhdGUgYXN5bmMgZGVjcnlwdFNlbGVjdGlvbihcclxuXHRcdGVkaXRvcjogQ29kZU1pcnJvci5FZGl0b3IsXHJcblx0XHRzZWxlY3Rpb25UZXh0OiBzdHJpbmcsXHJcblx0XHRwYXNzd29yZDogc3RyaW5nLFxyXG5cdFx0c2VsZWN0aW9uU3RhcnQ6IENvZGVNaXJyb3IuUG9zaXRpb24sXHJcblx0XHRzZWxlY3Rpb25FbmQ6IENvZGVNaXJyb3IuUG9zaXRpb24sXHJcblx0XHRkZWNyeXB0SW5QbGFjZTogYm9vbGVhblxyXG5cdCkge1xyXG5cdFx0Ly8gZGVjcnlwdFxyXG5cdFx0Y29uc3QgYmFzZTY0Q2lwaGVyVGV4dCA9IHRoaXMucmVtb3ZlTWFya2VycyhzZWxlY3Rpb25UZXh0KTtcclxuXHRcdGNvbnN0IGNyeXB0byA9IG5ldyBDcnlwdG9IZWxwZXIoKTtcclxuXHRcdGNvbnN0IGRlY3J5cHRlZFRleHQgPSBhd2FpdCBjcnlwdG8uZGVjcnlwdEZyb21CYXNlNjQoYmFzZTY0Q2lwaGVyVGV4dCwgcGFzc3dvcmQpO1xyXG5cdFx0aWYgKGRlY3J5cHRlZFRleHQgPT09IG51bGwpIHtcclxuXHRcdFx0bmV3IE5vdGljZSgn4p2MIERlY3J5cHRpb24gZmFpbGVkIScpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHJcblx0XHRcdGlmIChkZWNyeXB0SW5QbGFjZSkge1xyXG5cdFx0XHRcdGVkaXRvci5zZXRTZWxlY3Rpb24oc2VsZWN0aW9uU3RhcnQsIHNlbGVjdGlvbkVuZCk7XHJcblx0XHRcdFx0ZWRpdG9yLnJlcGxhY2VTZWxlY3Rpb24oZGVjcnlwdGVkVGV4dCwgJ2Fyb3VuZCcpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGNvbnN0IGRlY3J5cHRNb2RhbCA9IG5ldyBEZWNyeXB0TW9kYWwodGhpcy5hcHAsICfwn5STJywgZGVjcnlwdGVkVGV4dCk7XHJcblx0XHRcdFx0ZGVjcnlwdE1vZGFsLm9uQ2xvc2UgPSAoKSA9PiB7XHJcblx0XHRcdFx0XHRlZGl0b3IuZm9jdXMoKTtcclxuXHRcdFx0XHRcdGlmIChkZWNyeXB0TW9kYWwuZGVjcnlwdEluUGxhY2UpIHtcclxuXHRcdFx0XHRcdFx0ZWRpdG9yLnNldFNlbGVjdGlvbihzZWxlY3Rpb25TdGFydCwgc2VsZWN0aW9uRW5kKTtcclxuXHRcdFx0XHRcdFx0ZWRpdG9yLnJlcGxhY2VTZWxlY3Rpb24oZGVjcnlwdGVkVGV4dCwgJ2Fyb3VuZCcpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkZWNyeXB0TW9kYWwub3BlbigpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRwcml2YXRlIHJlbW92ZU1hcmtlcnModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcclxuXHRcdGlmICh0ZXh0LnN0YXJ0c1dpdGgoX1BSRUZJWCkgJiYgdGV4dC5lbmRzV2l0aChfU1VGRklYKSkge1xyXG5cdFx0XHRyZXR1cm4gdGV4dC5yZXBsYWNlKF9QUkVGSVgsICcnKS5yZXBsYWNlKF9TVUZGSVgsICcnKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0ZXh0O1xyXG5cdH1cclxuXHJcblx0cHJpdmF0ZSBhZGRNYXJrZXJzKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XHJcblx0XHRpZiAoIXRleHQuY29udGFpbnMoX1BSRUZJWCkgJiYgIXRleHQuY29udGFpbnMoX1NVRkZJWCkpIHtcclxuXHRcdFx0cmV0dXJuIF9QUkVGSVguY29uY2F0KHRleHQsIF9TVUZGSVgpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRleHQ7XHJcblx0fVxyXG5cclxufVxyXG4iXSwibmFtZXMiOlsiTW9kYWwiLCJQbHVnaW5TZXR0aW5nVGFiIiwiU2V0dGluZyIsIlBsdWdpbiIsIk1hcmtkb3duVmlldyIsIk5vdGljZSJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUF1REE7QUFDTyxTQUFTLFNBQVMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUU7QUFDN0QsSUFBSSxTQUFTLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLEtBQUssWUFBWSxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7QUFDaEgsSUFBSSxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxVQUFVLE9BQU8sRUFB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
