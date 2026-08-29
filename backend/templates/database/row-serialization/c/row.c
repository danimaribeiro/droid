#include "row.h"

/* TODO: Implement row serialization
 *
 * Fixed row layout: 4 bytes id (int32 LE) + 28 bytes name + 28 bytes email = 60 bytes
 *
 * serialize_row():     Row struct -> byte buffer
 * deserialize_row():   byte buffer -> Row struct
 * handle_serialize():  parse INSERT values, serialize, print hex
 * handle_deserialize():parse hex input, deserialize, print fields
 *
 * Expected output:
 *   [SERIALIZE] 01 00 00 00 64 61 6e ...
 *   [DESERIALIZE] Field id = 1
 *   [DESERIALIZE] Field name = dan
 *   [DESERIALIZE] Field email = dan@test.com
 */

void serialize_row(Row *row, char *buf) {
    // TODO
}

void deserialize_row(char *buf, Row *row) {
    // TODO
}

void handle_serialize(InsertStatement *stmt) {
    // TODO
}

void handle_deserialize(char *hex_input) {
    // TODO
}
