# Loopback Component for Extending Built-in Model

A component to extend Loopback built-in Model (User, AccessToken, etc.) without creating new Model. `loopback-component-extender` will loads Model extension synchronously.

## Features
1. Extend built-in model definition:
    - `acl`
    - `hidden`
    - `mixins`
    - `options`
    - `properties`
    - `relations` (**Polymorphic** and **HasAndBelongsToMany** is not supported yet)
    - Datasource-related options (e.g. `mysql`)

## Usage

Steps below is an example to extend `User` model:

1. Create model file `user-x.js` and `user-x.json` in `common/models` folder.
1. Write only attributes to be extended in `user-x.json` such as mapping model to MySQL table, add properties, add relations, etc. No need to rewrite what already defined in `User` model, unless you need it: 
    ```json
    {
      "mysql": {
        "table": "user"
      },
      "properties": {
        "emailVerified": {
          "type": "boolean",
          "mysql": {
            "columnName": "email_verified",
            "dataType": "smallint",
            "dataLength": null,
            "dataPrecision": 1,
            "dataScale": 0,
            "nullable": "N"
          }
        },
        "verificationToken": {
          "type": "string",
          "mysql": {
            "columnName": "verification_token",
            "dataType": "smallint",
            "dataLength": null,
            "dataPrecision": 1,
            "dataScale": 0,
            "nullable": "Y"
          }
        },
        "createdAt": {
          "type": "Date",
          "required": false,
          "mysql": {
            "columnName": "created_at",
            "dataType": "datetime",
            "nullable": "N"
          }
        },
        "updatedAt": {
          "type": "Date",
          "required": false,
          "mysqlz": {
            "columnName": "updated_at",
            "dataType": "datetime",
            "nullable": "N"
          }
        }
      },
      "mixin": {
        "Controller": true
      },
      "relations": {
        "customer": {
          "type": "hasOne",
          "model": "Customer",
          "foreignKey": "customerId"
        },
      }
    }
    ```
1. Write extended methods in `user-x.js` file.
    ```javascript
    module.exports = User => {
      const say = User.say = (userId, message) => {
        console.log('User %d said %s', userId, message)
      }

      User.prototype.say = function(message) => {
        let userId = this.id
        say(userId, message)
      }
    }
    ```
1. Enable component in `component-config.json`
    ```json
    {
      "loopback-component-extender": {
        "models": "User"
      }
    }
    ```

## TODOs
- [ ] Add support for extending **Polymorphic** and **HasAndBelongsToMany** relation
- [ ] API documentation
- [ ] Write test

## Related Works
- [`loopback-controller-mixin` - Separate remote method from Model file and hides pre-defined remote method](https://www.npmjs.com/package/loopback-controller-mixin)

## Contributors
- Saggaf Arsyad <saggaf@nusantarabetastudio.com>

