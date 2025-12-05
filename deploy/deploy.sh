#!/bin/bash

ssh podlomar@sasky.podlomar.me "rm -rf /var/www/chessnut.podlomar.me/*"
scp -r dist/* podlomar@sasky.podlomar.me:/var/www/chessnut.podlomar.me/
