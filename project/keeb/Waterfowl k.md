# Waterfowl k
```
/*
 * Copyright (c) 2022 The ZMK Contributors
 *
 *
 * SPDX-License-Identifier: MIT
 */

#include <behaviors.dtsi>
#include <dt-bindings/zmk/keys.h>
#include <dt-bindings/zmk/bt.h>

/ {
    keymap {
        compatible = "zmk,keymap";

        default_layer {
/* QWERTY
 *
 * ,----------------------------------.                      ,----------------------------------.
 * |   Q  |   W  |   E  |   R  |   T  |                      |   Y  |   U  |   I  |   O  |   P  |
 * |------+------+------+------+------|                      |------+------+------+------+------|
 * |   A  |   S  |   D  |   F  |   G  |                      |   H  |   J  |   K  |   L  |   ;  |
 * |------+------+------+------+------|  ,-----.    ,-----.  |------+------+------+------+------|
 * |   Z  |   X  |   C  |   V  |   B  |  |  2  |    |  3  |  |   N  |   M  |   ,  |   .  |   /  |
 * `----------------------------------'  `-----'    `-----'  `----------------------------------'
 *          ,-----.   ,--------------------.            ,--------------------.   ,-----.
 *          |  1  |   | DEL | SPACE | TAB  |            |  ESC  | BS | ENTER |   |  4  |
 *          `-----'   `--------------------'            `--------------------'   `-----'
 */
            bindings = <
 //* ,----------------------------------.                      ,----------------------------------.
 //*|   Q  |   W  |   E  |   R  |   T  |                      |   Y  |   U  |   I  |   O  |   P  |
// * |------+------+------+------+------|                      |------+------+------+------+------|
    &kp Q       &kp W       &kp E       &kp R       &kp T           &kp Y   &kp U       &kp I       &kp O       &kp P
 //* |------+------+------+------+------|                      |------+------+------+------+------|
 //* |   A  |   S  |   D  |   F  |   G  |                      |   H  |   J  |   K  |   L  |   ;  |
 //* |------+------+------+------+------|  ,-----.    ,-----.  |------+------+------+------+------|
 
 &mt LGUI A  &mt LALT S  &mt LCTRL D &mt LSHFT F &kp G           &kp H   &mt LSHFT J &mt LCTRL K &mt LALT L  &mt LGUI SEMI
 //* |------+------+------+------+------|  ,-----.    ,-----.  |------+------+------+------+------|
 //* |   Z  |   X  |   C  |   V  |   B  |  |  2  |    |  3  |  |   N  |   M  |   ,  |   .  |   /  |
 //* `----------------------------------'  `-----'    `-----'  `----------------------------------'


    &kp Z       &kp X       &kp C       &kp V       &kp B           &kp N   &kp M       &kp COMMA   &kp DOT     &kp FSLH
    &kp N1      &lt 3 DEL   &lt 1 SPACE &kp TAB     &kp N2          &kp N3  &kp ESC     &kp BSPC    &lt 2 RET   &kp N4
            >;

            sensor-bindings = <&inc_dec_kp PAGE_UP PAGE_DOWN &inc_dec_kp TAB LS(TAB)>;
        };

        navnum_layer {
/* NAVNUM
 *
 * ,----------------------------------.                      ,----------------------------------.
 * |      | PgUp |  UP  | PgDn |      |                      |   /  |   7  |   8  |   9  |   -  |
 * |------+------+------+------+------|                      |------+------+------+------+------|
 * | Home | Left | Down | Right| End  |                      |   =  |   4  |   5  |   6  |   +  |
 * |------+------+------+------+------|  ,-----.    ,-----.  |------+------+------+------+------|
 * |      |      |  INS |      |      |  |  2  |    |  3  |  |   0  |   1  |   2  |   3  |   *  |
 * `----------------------------------'  `-----'    `-----'  `----------------------------------'
 *          ,-----.   ,--------------------.            ,--------------------.   ,-----.
 *          |  1  |   | DEL | SPACE | MO(3)|            |  ESC  | BS | ENTER |   |  4  |
 *          `-----'   `--------------------'            `--------------------'   `-----'
 */
            bindings = <
    &trans      &kp PG_UP   &kp UP      &kp PG_DN   &trans                  &kp FSLH    &kp N7  &kp N8      &kp N9      &kp MINUS
    &kp HOME    &kp LEFT    &kp DOWN    &kp RIGHT   &kp END                 &kp EQUAL   &kp N4  &kp N5      &kp N6      &kp PLUS
    &trans      &trans      &kp INS     &trans      &trans                  &kp N0      &kp N1  &kp N2      &kp N3      &kp ASTERISK
    &kp N1      &lt 3 DEL   &lt 1 SPACE &kp TAB     &kp N2                  &kp N3      &kp ESC &kp BSPC    &lt 2 RET   &kp N4
            >;

            sensor-bindings = <&inc_dec_kp PAGE_UP PAGE_DOWN &inc_dec_kp TAB LS(TAB)>;
        };

        symbol_layer {
/* SYM
 *
 * ,----------------------------------.                      ,----------------------------------.
 * |   %  |   @  |   [  |   ]  |   \  |                      |      |      |   ^  |      |      |
 * |------+------+------+------+------|                      |------+------+------+------+------|
 * |   #  |   !  |   (  |   )  |   |  |                      |   _  |   '  |   "  |   ~  |   `  |
 * |------+------+------+------+------|  ,-----.    ,-----.  |------+------+------+------+------|
 * |   $  |      |   {  |   }  |   &  |  |  2  |    |  3  |  |      |      |      |      |      |
 * `----------------------------------'  `-----'    `-----'  `----------------------------------'
 *          ,-----.   ,--------------------.            ,--------------------.   ,-----.
 *          |  1  |   | DEL | SPACE | TAB  |            |  ESC  | BS | ENTER |   |  4  |
 *          `-----'   `--------------------'            `--------------------'   `-----'
 */
            bindings = <
    &kp PRCNT       &kp AT      &kp LBKT    &kp RBKT    &kp NON_US_BSLH         &trans          &trans          &kp CARET           &trans      &trans
    &kp HASH        &kp EXCL    &kp LPAR    &kp RPAR    &kp PIPE                &kp UNDER       &kp APOS        &kp DOUBLE_QUOTES   &kp TILDE   &kp GRAVE
    &kp DLLR        &trans      &kp LBRC    &kp RBRC    &kp AMPS                &trans          &trans          &trans              &trans      &trans
    &kp N1          &lt 3 DEL   &lt 1 SPACE &kp TAB     &kp N2                  &kp N3          &kp ESC         &kp BSPC            &lt 2 RET   &kp N4
            >;

            sensor-bindings = <&inc_dec_kp PAGE_UP PAGE_DOWN &inc_dec_kp TAB LS(TAB)>;
        };

        function_layer {
/* FUNC
 *
 * ,----------------------------------.                      ,----------------------------------.
 * |      |      | BTCLR|      | Reset|                      | Reset|  F7  |  F8  |  F9  |  F11 |
 * |------+------+------+------+------|                      |------+------+------+------+------|
 * |  BT0 |  BT1 |  BT2 |  BT3 |  BT4 |                      |      |  F4  |  F5  |  F6  |  F12 |
 * |------+------+------+------+------|  ,-----.    ,-----.  |------+------+------+------+------|
 * |      |      |      |      |      |  |  2  |    |  3  |  |  F10 |  F1  |  F2  |  F3  |  F13 |
 * `----------------------------------'  `-----'    `-----'  `----------------------------------'
 *          ,-----.   ,--------------------.            ,--------------------.   ,-----.
 *          |  1  |   | DEL | SPACE | TAB  |            |  ESC  | BS | ENTER |   |  4  |
 *          `-----'   `--------------------'            `--------------------'   `-----'
 */
            bindings = <
    &trans          &trans          &bt BT_CLR      &trans          &sys_reset          &sys_reset  &kp F7  &kp F8      &kp F9      &kp F11
    &bt BT_SEL 0    &bt BT_SEL 1    &bt BT_SEL 2    &bt BT_SEL 3    &bt BT_SEL 4        &trans      &kp F4  &kp F5      &kp F6      &kp F12
    &trans          &trans          &trans          &trans          &trans              &kp F10     &kp F1  &kp F2      &kp F3      &kp F13
    &kp N1          &lt 3 DEL       &lt 1 SPACE     &kp TAB         &kp N2              &kp N3      &kp ESC &kp BSPC    &lt 2 RET   &kp N4
            >;

            sensor-bindings = <&inc_dec_kp PAGE_UP PAGE_DOWN &inc_dec_kp TAB LS(TAB)>;
        };

    };
};
```

