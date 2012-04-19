//JavaScript Image Resizer (c) 2012 - Grant Galitz
function Resize(widthOriginal, heightOriginal, targetWidth, targetHeight, blendAlpha, interpolationPass) {
	this.widthOriginal = Math.abs(parseInt(widthOriginal) || 0);
	this.heightOriginal = Math.abs(parseInt(heightOriginal) || 0);
	this.targetWidth = Math.abs(parseInt(targetWidth) || 0);
	this.targetHeight = Math.abs(parseInt(targetHeight) || 0);
	this.colorChannels = (!!blendAlpha) ? 4 : 3;
	this.interpolationPass = !!interpolationPass;
	this.targetWidthMultipliedByChannels = this.targetWidth * this.colorChannels;
	this.originalWidthMultipliedByChannels = this.widthOriginal * this.colorChannels;
	this.originalHeightMultipliedByChannels = this.heightOriginal * this.colorChannels;
	this.widthPassResultSize = this.targetWidthMultipliedByChannels * this.heightOriginal;
	this.finalResultSize = this.targetWidthMultipliedByChannels * this.targetHeight;
	this.initialize();
}
Resize.prototype.initialize = function () {
	//Perform some checks:
	if (this.widthOriginal > 0 && this.heightOriginal > 0 && this.targetWidth > 0 && this.targetHeight > 0) {
		if (this.widthOriginal == this.targetWidth) {
			//Bypass the width resizer pass:
			this.resizeWidth = this.bypassResizer;
		}
		else {
			//Setup the width resizer pass:
			this.ratioWeightWidthPass = this.widthOriginal / this.targetWidth;
			this.initializeFirstPassBuffers();
			this.resizeWidth = (this.ratioWeightWidthPass < 1 && this.interpolationPass) ? ((this.colorChannels == 4) ? this.resizeWidthInterpolatedRGBA : this.resizeWidthInterpolatedRGB) : ((this.colorChannels == 4) ? this.resizeWidthRGBA : this.resizeWidthRGB);
		}
		if (this.heightOriginal == this.targetHeight) {
			//Bypass the height resizer pass:
			this.resizeHeight = this.bypassResizer;
		}
		else {	
			//Setup the height resizer pass:
			this.ratioWeightHeightPass = this.heightOriginal / this.targetHeight;
			this.initializeSecondPassBuffers();
			this.resizeHeight = (this.ratioWeightHeightPass < 1 && this.interpolationPass) ? this.resizeHeightInterpolated : ((this.colorChannels == 4) ? this.resizeHeightRGBA : this.resizeHeightRGB);
		}
	}
	else {
		throw(new Error("Invalid settings specified for the resizer."));
	}
}
Resize.prototype.resizeWidthRGB = function (buffer) {
	var ratioWeight = this.ratioWeightWidthPass;
	var weight = 0;
	var amountToNext = 0;
	var actualPosition = 0;
	var currentPosition = 0;
	var line = 0;
	var pixelOffset = 0;
	var outputOffset = 0;
	var nextLineOffsetOriginalWidth = this.originalWidthMultipliedByChannels - 2;
	var nextLineOffsetTargetWidth = this.targetWidthMultipliedByChannels - 2;
	var output = this.outputWidthWorkBench;
	var outputBuffer = this.widthBuffer;
	do {
		for (line = 0; line < this.originalHeightMultipliedByChannels;) {
			output[line++] = 0;
			output[line++] = 0;
			output[line++] = 0;
		}
		weight = ratioWeight;
		do {
			amountToNext = 1 + actualPosition - currentPosition;
			if (weight >= amountToNext) {
				for (line = 0, pixelOffset = actualPosition; line < this.originalHeightMultipliedByChannels; pixelOffset += nextLineOffsetOriginalWidth) {
					output[line++] += buffer[pixelOffset++] * amountToNext;
					output[line++] += buffer[pixelOffset++] * amountToNext;
					output[line++] += buffer[pixelOffset] * amountToNext;
				}
				currentPosition = actualPosition = actualPosition + 3;
				weight -= amountToNext;
			}
			else {
				for (line = 0, pixelOffset = actualPosition; line < this.originalHeightMultipliedByChannels; pixelOffset += nextLineOffsetOriginalWidth) {
					output[line++] += buffer[pixelOffset++] * weight;
					output[line++] += buffer[pixelOffset++] * weight;
					output[line++] += buffer[pixelOffset] * weight;
				}
				currentPosition += weight;
				break;
			}
		} while (weight > 0 && actualPosition < this.originalWidthMultipliedByChannels);
		for (line = 0, pixelOffset = outputOffset; line < this.originalHeightMultipliedByChannels; pixelOffset += nextLineOffsetTargetWidth) {
			outputBuffer[pixelOffset++] = output[line++] / ratioWeight;
			outputBuffer[pixelOffset++] = output[line++] / ratioWeight;
			outputBuffer[pixelOffset] = output[line++] / ratioWeight;
		}
		outputOffset += 3;
	} while (outputOffset < this.targetWidthMultipliedByChannels);
	return outputBuffer;
}
Resize.prototype.resizeWidthInterpolatedRGB = function (buffer) {
	var ratioWeight = (this.widthOriginal - 1) / this.targetWidth;
	var weight = 0;
	var finalOffset = 0;
	var pixelOffset = 0;
	var outputBuffer = this.widthBuffer;
	for (var targetPosition = 0; targetPosition < this.targetWidthMultipliedByChannels; targetPosition += 3, weight += ratioWeight) {
		//Calculate weightings:
		secondWeight = weight % 1;
		firstWeight = 1 - secondWeight;
		//Interpolate:
		for (finalOffset = targetPosition, pixelOffset = Math.floor(weight) * 3; finalOffset < this.widthPassResultSize; pixelOffset += this.originalWidthMultipliedByChannels, finalOffset += this.targetWidthMultipliedByChannels) {
			outputBuffer[finalOffset] = (buffer[pixelOffset] * firstWeight) + (buffer[pixelOffset + 3] * secondWeight);
			outputBuffer[finalOffset + 1] = (buffer[pixelOffset + 1] * firstWeight) + (buffer[pixelOffset + 4] * secondWeight);
			outputBuffer[finalOffset + 2] = (buffer[pixelOffset + 2] * firstWeight) + (buffer[pixelOffset + 5] * secondWeight);
		}
	}
	return outputBuffer;
}
Resize.prototype.resizeWidthRGBA = function (buffer) {
	var ratioWeight = this.ratioWeightWidthPass;
	var weight = 0;
	var amountToNext = 0;
	var actualPosition = 0;
	var currentPosition = 0;
	var line = 0;
	var pixelOffset = 0;
	var outputOffset = 0;
	var nextLineOffsetOriginalWidth = this.originalWidthMultipliedByChannels - 3;
	var nextLineOffsetTargetWidth = this.targetWidthMultipliedByChannels - 3;
	var output = this.outputWidthWorkBench;
	var outputBuffer = this.widthBuffer;
	do {
		for (line = 0; line < this.originalHeightMultipliedByChannels;) {
			output[line++] = 0;
			output[line++] = 0;
			output[line++] = 0;
			output[line++] = 0;
		}
		weight = ratioWeight;
		do {
			amountToNext = 1 + actualPosition - currentPosition;
			if (weight >= amountToNext) {
				for (line = 0, pixelOffset = actualPosition; line < this.originalHeightMultipliedByChannels; pixelOffset += nextLineOffsetOriginalWidth) {
					output[line++] += buffer[pixelOffset++] * amountToNext;
					output[line++] += buffer[pixelOffset++] * amountToNext;
					output[line++] += buffer[pixelOffset++] * amountToNext;
					output[line++] += buffer[pixelOffset] * amountToNext;
				}
				currentPosition = actualPosition = actualPosition + 4;
				weight -= amountToNext;
			}
			else {
				for (line = 0, pixelOffset = actualPosition; line < this.originalHeightMultipliedByChannels; pixelOffset += nextLineOffsetOriginalWidth) {
					output[line++] += buffer[pixelOffset++] * weight;
					output[line++] += buffer[pixelOffset++] * weight;
					output[line++] += buffer[pixelOffset++] * weight;
					output[line++] += buffer[pixelOffset] * weight;
				}
				currentPosition += weight;
				break;
			}
		} while (weight > 0 && actualPosition < this.originalWidthMultipliedByChannels);
		for (line = 0, pixelOffset = outputOffset; line < this.originalHeightMultipliedByChannels; pixelOffset += nextLineOffsetTargetWidth) {
			outputBuffer[pixelOffset++] = output[line++] / ratioWeight;
			outputBuffer[pixelOffset++] = output[line++] / ratioWeight;
			outputBuffer[pixelOffset++] = output[line++] / ratioWeight;
			outputBuffer[pixelOffset] = output[line++] / ratioWeight;
		}
		outputOffset += 4;
	} while (outputOffset < this.targetWidthMultipliedByChannels);
	return outputBuffer;
}
Resize.prototype.resizeWidthInterpolatedRGBA = function (buffer) {
	var ratioWeight = (this.widthOriginal - 1) / this.targetWidth;
	var weight = 0;
	var finalOffset = 0;
	var pixelOffset = 0;
	var outputBuffer = this.widthBuffer;
	for (var targetPosition = 0; targetPosition < this.targetWidthMultipliedByChannels; targetPosition += 4, weight += ratioWeight) {
		//Calculate weightings:
		secondWeight = weight % 1;
		firstWeight = 1 - secondWeight;
		//Interpolate:
		for (finalOffset = targetPosition, pixelOffset = Math.floor(weight) * 4; finalOffset < this.widthPassResultSize; pixelOffset += this.originalWidthMultipliedByChannels, finalOffset += this.targetWidthMultipliedByChannels) {
			outputBuffer[finalOffset] = (buffer[pixelOffset] * firstWeight) + (buffer[pixelOffset + 4] * secondWeight);
			outputBuffer[finalOffset + 1] = (buffer[pixelOffset + 1] * firstWeight) + (buffer[pixelOffset + 5] * secondWeight);
			outputBuffer[finalOffset + 2] = (buffer[pixelOffset + 2] * firstWeight) + (buffer[pixelOffset + 6] * secondWeight);
			outputBuffer[finalOffset + 3] = (buffer[pixelOffset + 3] * firstWeight) + (buffer[pixelOffset + 7] * secondWeight);
		}
	}
	return outputBuffer;
}
Resize.prototype.resizeHeightRGB = function (buffer) {
	var ratioWeight = this.ratioWeightHeightPass;
	var weight = 0;
	var amountToNext = 0;
	var actualPosition = 0;
	var currentPosition = 0;
	var pixelOffset = 0;
	var outputOffset = 0;
	var output = this.outputHeightWorkBench;
	var outputBuffer = this.heightBuffer;
	do {
		for (pixelOffset = 0; pixelOffset < this.targetWidthMultipliedByChannels;) {
			output[pixelOffset++] = 0;
			output[pixelOffset++] = 0;
			output[pixelOffset++] = 0;
		}
		weight = ratioWeight;
		do {
			amountToNext = 1 + actualPosition - currentPosition;
			if (weight >= amountToNext) {
				for (pixelOffset = 0; pixelOffset < this.targetWidthMultipliedByChannels;) {
					output[pixelOffset++] += buffer[actualPosition++] * amountToNext;
					output[pixelOffset++] += buffer[actualPosition++] * amountToNext;
					output[pixelOffset++] += buffer[actualPosition++] * amountToNext;
				}
				currentPosition = actualPosition;
				weight -= amountToNext;
			}
			else {
				for (pixelOffset = 0, amountToNext = actualPosition; pixelOffset < this.targetWidthMultipliedByChannels;) {
					output[pixelOffset++] += buffer[amountToNext++] * weight;
					output[pixelOffset++] += buffer[amountToNext++] * weight;
					output[pixelOffset++] += buffer[amountToNext++] * weight;
				}
				currentPosition += weight;
				break;
			}
		} while (weight > 0 && actualPosition < this.widthPassResultSize);
		for (pixelOffset = 0; pixelOffset < this.targetWidthMultipliedByChannels;) {
			outputBuffer[outputOffset++] = Math.round(output[pixelOffset++] / ratioWeight);
			outputBuffer[outputOffset++] = Math.round(output[pixelOffset++] / ratioWeight);
			outputBuffer[outputOffset++] = Math.round(output[pixelOffset++] / ratioWeight);
		}
	} while (outputOffset < this.finalResultSize);
	return outputBuffer;
}
Resize.prototype.resizeHeightInterpolated = function (buffer) {
	var ratioWeight = (this.heightOriginal - 1) / this.targetHeight;
	var weight = 0;
	var finalOffset = 0;
	var pixelOffset = 0;
	var pixelOffsetAccumulated = 0;
	var pixelOffsetAccumulated2 = 0;
	var outputBuffer = this.heightBuffer;
	do {
		//Calculate weightings:
		secondWeight = weight % 1;
		firstWeight = 1 - secondWeight;
		//Interpolate:
		pixelOffsetAccumulated = Math.floor(weight) * this.targetWidthMultipliedByChannels;
		pixelOffsetAccumulated2 = pixelOffsetAccumulated + this.targetWidthMultipliedByChannels;
		for (pixelOffset = 0; pixelOffset < this.targetWidthMultipliedByChannels; ++pixelOffset) {
			outputBuffer[finalOffset++] = (buffer[pixelOffsetAccumulated + pixelOffset] * firstWeight) + (buffer[pixelOffsetAccumulated2 + pixelOffset] * secondWeight);
		}
		weight += ratioWeight;
	} while (finalOffset < this.finalResultSize);
	return outputBuffer;
}
Resize.prototype.resizeHeightRGBA = function (buffer) {
	var ratioWeight = this.ratioWeightHeightPass;
	var weight = 0;
	var amountToNext = 0;
	var actualPosition = 0;
	var currentPosition = 0;
	var pixelOffset = 0;
	var outputOffset = 0;
	var output = this.outputHeightWorkBench;
	var outputBuffer = this.heightBuffer;
	do {
		for (pixelOffset = 0; pixelOffset < this.targetWidthMultipliedByChannels;) {
			output[pixelOffset++] = 0;
			output[pixelOffset++] = 0;
			output[pixelOffset++] = 0;
			output[pixelOffset++] = 0;
		}
		weight = ratioWeight;
		do {
			amountToNext = 1 + actualPosition - currentPosition;
			if (weight >= amountToNext) {
				for (pixelOffset = 0; pixelOffset < this.targetWidthMultipliedByChannels;) {
					output[pixelOffset++] += buffer[actualPosition++] * amountToNext;
					output[pixelOffset++] += buffer[actualPosition++] * amountToNext;
					output[pixelOffset++] += buffer[actualPosition++] * amountToNext;
					output[pixelOffset++] += buffer[actualPosition++] * amountToNext;
				}
				currentPosition = actualPosition;
				weight -= amountToNext;
			}
			else {
				for (pixelOffset = 0, amountToNext = actualPosition; pixelOffset < this.targetWidthMultipliedByChannels;) {
					output[pixelOffset++] += buffer[amountToNext++] * weight;
					output[pixelOffset++] += buffer[amountToNext++] * weight;
					output[pixelOffset++] += buffer[amountToNext++] * weight;
					output[pixelOffset++] += buffer[amountToNext++] * weight;
				}
				currentPosition += weight;
				break;
			}
		} while (weight > 0 && actualPosition < this.widthPassResultSize);
		for (pixelOffset = 0; pixelOffset < this.targetWidthMultipliedByChannels;) {
			outputBuffer[outputOffset++] = Math.round(output[pixelOffset++] / ratioWeight);
			outputBuffer[outputOffset++] = Math.round(output[pixelOffset++] / ratioWeight);
			outputBuffer[outputOffset++] = Math.round(output[pixelOffset++] / ratioWeight);
			outputBuffer[outputOffset++] = Math.round(output[pixelOffset++] / ratioWeight);
		}
	} while (outputOffset < this.finalResultSize);
	return outputBuffer;
}
Resize.prototype.resizeHeightInterpolatedRGBA = function (buffer) {
	var ratioWeight = (this.heightOriginal - 1) / this.targetHeight;
	var weight = 0;
	var finalOffset = 0;
	var pixelOffset = 0;
	var outputBuffer = this.heightBuffer;
	while (pixelOffset < this.finalResultSize) {
		//Calculate weightings:
		secondWeight = weight % 1;
		firstWeight = 1 - secondWeight;
		//Interpolate:
		for (pixelOffset = Math.floor(weight) * 4; pixelOffset < this.targetWidthMultipliedByChannels; pixelOffset += 4) {
			outputBuffer[finalOffset++] = (buffer[pixelOffset] * firstWeight) + (buffer[pixelOffset + 4] * secondWeight);
			outputBuffer[finalOffset++] = (buffer[pixelOffset + 1] * firstWeight) + (buffer[pixelOffset + 5] * secondWeight);
			outputBuffer[finalOffset++] = (buffer[pixelOffset + 2] * firstWeight) + (buffer[pixelOffset + 6] * secondWeight);
			outputBuffer[finalOffset++] = (buffer[pixelOffset + 3] * firstWeight) + (buffer[pixelOffset + 7] * secondWeight);
		}
		weight += ratioWeight;
	}
	return outputBuffer;
}
Resize.prototype.resize = function (buffer) {
	return this.resizeHeight(this.resizeWidth(buffer));
}
Resize.prototype.bypassResizer = function (buffer) {
	//Just return the buffer passsed:
	return buffer;
}
Resize.prototype.initializeFirstPassBuffers = function () {
	//Initialize the internal width pass buffers:
	this.widthBuffer = this.generateFloatBuffer(this.widthPassResultSize);
	this.outputWidthWorkBench = this.generateFloatBuffer(this.originalHeightMultipliedByChannels);
}
Resize.prototype.initializeSecondPassBuffers = function () {
	//Initialize the internal height pass buffers:
	this.heightBuffer = this.generateUint8Buffer(this.finalResultSize);
	this.outputHeightWorkBench = this.generateFloatBuffer(this.targetWidthMultipliedByChannels);
}
Resize.prototype.generateFloatBuffer = function (bufferLength) {
	//Generate a float32 typed array buffer:
	try {
		return new Float32Array(bufferLength);
	}
	catch (error) {
		return [];
	}
}
Resize.prototype.generateUint8Buffer = function (bufferLength) {
	//Generate a uint8 typed array buffer:
	try {
		return this.checkForOperaMathBug(new Uint8Array(bufferLength));
	}
	catch (error) {
		return [];
	}
}
Resize.prototype.checkForOperaMathBug = function (typedArray) {
	typedArray[0] = -1;
	typedArray[0] >>= 0;
	if (typedArray[0] != 0xFF) {
		return [];
	}
	else {
		return typedArray;
	}
}