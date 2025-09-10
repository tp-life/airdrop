//go:build opencv

package encode

import (
	"bytes"
	"encoding/base64"
	"image"
	"image/png"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"gocv.io/x/gocv"
)

func GetLoc(bgImgURL string, blockImgURL string, userDir string) image.Point {
	filePath, _ := filepath.Abs(userDir)
	bgImageBytes, imageSize, err := getImageBase64FromURL(bgImgURL, filePath+"/bgImg.png")

	if err != nil {
		println(err)
	}

	blockImageBytes, blockImageSize, err := getImageBase64FromURL(blockImgURL, filePath+"/block.png")
	if err != nil {
		println(err)
	}

	_, bg, err := preProcess(bgImageBytes, imageSize.X, imageSize.Y)
	if err != nil {
		println(err)
	}
	defer bg.Close()

	alpha, block, err := preProcess(blockImageBytes, blockImageSize.X, blockImageSize.Y)
	if err != nil {
		println(err)
	}

	defer block.Close()

	rect := image.Rect(14, 14, 68, 68)
	croppedMat := block.Region(rect)

	croppedAlpha := alpha.Region(rect)

	// cvtMatToImage(croppedAlpha, ".png")

	loc := match(bg, croppedMat.Clone(), croppedAlpha)

	return loc
}

func decode(b64img string) []byte {
	// i := strings.IndexByte(b64img, ',')
	// if i == -1 {
	// 	// log.Error(b64img)
	// 	return nil
	// }
	b, err := base64.StdEncoding.DecodeString(b64img)
	if err != nil {
		// log.Error(err, b64img[i+1:])
		return nil
	}
	return b
}

func readBase64Image(imageBytes []byte) (gocv.Mat, error) {
	origin, err := gocv.IMDecode(imageBytes, gocv.IMReadUnchanged)
	if err != nil {
		return gocv.Mat{}, err
	}
	return origin, nil
}

func resize(origin gocv.Mat, cols, rows int) gocv.Mat {
	resized := gocv.NewMatWithSize(cols, rows, origin.Type())
	gocv.Resize(origin, &resized, image.Pt(cols, rows), 0, 0, gocv.InterpolationNearestNeighbor)
	return resized
}

func gray(origin gocv.Mat) gocv.Mat {
	grayed := gocv.NewMat()
	gocv.CvtColor(origin, &grayed, gocv.ColorBGRToGray)
	return grayed
}

func threshold(origin gocv.Mat) gocv.Mat {
	thresholdBG := gocv.NewMat()
	gocv.Threshold(origin, &thresholdBG, 100, 255, gocv.ThresholdBinaryInv)
	return thresholdBG
}

func match(bg, block, mask gocv.Mat) image.Point {
	result := gocv.NewMatWithSize(
		bg.Rows()-block.Rows()+1,
		bg.Cols()-block.Cols()+1,
		gocv.MatTypeCV32FC1)
	defer result.Close()

	m := gocv.NewMat()
	gocv.MatchTemplate(bg, block, &result, gocv.TmSqdiffNormed, m)
	gocv.Normalize(result, &result, 0, 1, gocv.NormMinMax)

	_, _, _, maxLoc := gocv.MinMaxLoc(result)

	// 将匹配的地方圈起来，并重新输出图片
	// trows := block.Rows()
	// tcols := block.Cols()

	// r := image.Rectangle{
	// 	Min: maxLoc,
	// 	Max: image.Pt(int(maxLoc.X+tcols), int(maxLoc.Y)+trows),
	// }
	// // 用 2px 的红色框框 画出来
	// gocv.Rectangle(&bg, r, color.RGBA{255, 0, 0, 1}, 2)

	// gocv.IMWrite("out.png", bg)

	return maxLoc
}

func preProcess(imageBytes []byte, width, heigh int) (alpha, processed gocv.Mat, err error) {
	origin, err := readBase64Image(imageBytes)
	if err != nil {
		return gocv.Mat{}, gocv.Mat{}, err
	}
	//defer origin.Close()

	resized := resize(origin, width, heigh)
	grayed := gray(resized)
	//threshold := threshold(grayed)
	//defer resized.Close()
	//defer grayed.Close()
	//defer threshold.Close()

	// log.Debug(origin.Cols(), origin.Rows(), resized.Cols(), resized.Rows())

	if resized.Channels() == 4 {
		return gocv.Split(resized)[3], grayed, nil
	}

	println(resized.Channels())

	return gocv.Mat{}, grayed, nil
}

func getImageBase64FromURL(imageURL string, filePath string) ([]byte, image.Point, error) {
	url := imageURL
	// don't worry about errors
	response, e := http.Get(url)
	if e != nil {
		log.Fatal(e)
	}
	defer response.Body.Close()

	//open a file for writing
	file, err := os.Create(filePath)
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	_, err = io.Copy(file, response.Body)

	imageFile, openErr := os.Open(filePath)
	defer imageFile.Close()

	println(openErr)
	imageData, _, err := image.Decode(imageFile)

	imageSize := imageData.Bounds().Size()

	// if err != nil {
	// 	log.Println(err)
	// 	return "", err
	// }

	// println(imageType)

	buf := new(bytes.Buffer)
	err = png.Encode(buf, imageData)
	send_s3 := buf.Bytes()

	// imgBase64Str := base64.StdEncoding.EncodeToString(send_s3)
	return send_s3, imageSize, nil
}

func cvtMatToImage(mat gocv.Mat, format string) (img image.Image, err error) {
	buf, err := gocv.IMEncode(gocv.FileExt(format), mat)
	if err != nil {
		return nil, err
	}

	reader := bytes.NewReader(buf.GetBytes())
	dest, _, err := image.Decode(reader)
	if err != nil {
		return nil, err
	}

	f, err := os.Create("image.png")
	if err != nil {
		return nil, err
	}
	defer f.Close()

	if err = png.Encode(f, dest); err != nil {
		return nil, err
	}

	return dest, err
}
