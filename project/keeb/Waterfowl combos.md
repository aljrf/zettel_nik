# Waterfowl combos


```
#define COMBO(NAME, BINDINGS, KEYPOS) \
  combo_##NAME { \
    timeout-ms = <50>; \
    bindings = <BINDINGS>; \
    key-positions = <KEYPOS>; \
    layers = <0>; \
  };

/ {

        behaviors {
                hm: homerow_mods {
                        compatible = "zmk,behavior-hold-tap";
                        label = "HOMEROW_MODS";
                        #binding-cells = <2>;
                        tapping_term_ms = <150>;
                        flavor = "tap-preferred";
                        bindings = <&kp>, <&kp>;
                };
        };

        combos {
                compatible = "zmk,combos";
                      
                COMBO(slash, &kp SLASH, 27 28)
                COMBO(backslash, &kp BSLH, 28 29)

                COMBO(esckey, &kp ESC, 2 3)
                COMBO(tabkey, &kp TAB, 12 13)
                
                COMBO(minus, &kp MINUS, 20 21)
                COMBO(under, &kp UNDER, 21 22)
                COMBO(tilde, &kp TILDE, 22 23)
                
                COMBO(one, &kp N1, 0 10)
                COMBO(two, &kp N2, 1 11)
                COMBO(three, &kp N3, 2 12)
                COMBO(four, &kp N4, 3 13)
                COMBO(five, &kp N5, 4 14)
                COMBO(six, &kp N6, 5 15)
                COMBO(seven, &kp N7, 6 16)
                COMBO(eight, &kp N8, 7 17)
                COMBO(nine, &kp N9, 8 18)
                COMBO(zero, &kp N0, 9 19)
        };
```


