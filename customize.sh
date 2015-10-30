#!/bin/bash
for file in ./views/layouts/*.handlebars
do
	echo $file
	sed -f customize.sed $file > tmp
	mv tmp $file 
done
for file in ./views/*.handlebars
do
	echo $file
	sed -f customize.sed $file > tmp 
	mv tmp $file 
done
