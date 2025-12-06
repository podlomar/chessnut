#!/bin/bash

rsync -avz --delete dist/ podlomar@chessnut.podlomar.me:/var/www/chessnut.podlomar.me/
