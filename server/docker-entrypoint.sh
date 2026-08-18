#!/bin/sh

# exit on error
set -e

# start nginx
exec nginx -g "daemon off;"
